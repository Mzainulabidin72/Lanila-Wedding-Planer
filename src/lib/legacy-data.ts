/**
 * Data LAMA (sebelum data dipisah per akun) dan cara menanganinya dengan aman.
 *
 * Versi lama menyimpan SELURUH data pernikahan dalam satu key global
 * (lanila-wp:<id-workspace>, mis. lanila-wp:wk_abidin_nila) TANPA mencatat akun mana
 * pemiliknya. Jadi kepemilikannya TIDAK dapat diverifikasi. Aturan di sini:
 *
 *  1. Data lama tidak pernah dibaca sebagai data akun mana pun secara otomatis.
 *  2. Setelah login, data lama hanya DISALIN ke arsip terisolasi (cadangan). Sumbernya
 *     tidak diubah dan tidak pernah dihapus.
 *  3. Mengimpor ke sebuah akun hanya terjadi atas keputusan pengguna, hanya jika akun itu
 *     belum punya proyek (tidak menimpa apa pun), dan hasilnya diverifikasi.
 *  4. Impor idempoten: mengulang tidak menggandakan atau menimpa data.
 */

import { newId } from "./store-actions";
import {
  emptyUserData,
  listStorageKeys,
  loadUserData,
  saveUserData,
  storageKey,
  StorageLike,
  UserData,
} from "./user-storage";
import type { WeddingWorkspace } from "./types";

/** key lama: lanila-wp:<apa saja> KECUALI key bernomor versi (lanila-wp:v2:<userId>). */
const LEGACY_KEY = /^lanila-wp:(?!v\d+:)/;

export const ARCHIVE_PREFIX = "lanila:wedding:legacy-archive:";
export const importMarkerKey = (userId: string) => `lanila:wedding:${userId}:legacy-import`;
export const dismissedKey = (userId: string) => `lanila:wedding:${userId}:legacy-dismissed`;

export function isLegacyKey(key: string): boolean {
  return LEGACY_KEY.test(key);
}

/** Hash sederhana (djb2) untuk mengenali isi yang sama; bukan untuk keamanan. */
export function hashString(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export function findLegacyKeys(storage: StorageLike | null): string[] {
  return listStorageKeys(storage).filter(isLegacyKey);
}

export interface LegacyCounts {
  stages: number;
  tasks: number;
  budgetItems: number;
  vendors: number;
  guests: number;
  seserahan: number;
}

export interface LegacySummary {
  sourceKey: string;
  hash: string;
  workspaceName: string;
  counts: LegacyCounts;
}

const ENTITY_FIELDS = ["stages", "tasks", "budgetItems", "vendors", "guests", "seserahan", "activityLog"] as const;
type EntityField = (typeof ENTITY_FIELDS)[number];

/** Isi key lama yang dapat dibaca (bentuk workspace + daftar entitas), atau null. */
function parseLegacy(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown> | null;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const ws = data.workspace as Record<string, unknown> | undefined;
    if (!ws || typeof ws !== "object" || typeof ws.name !== "string" || !ws.name.trim()) return null;
    for (const f of ENTITY_FIELDS) {
      if (data[f] !== undefined && !Array.isArray(data[f])) return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function summarizeLegacy(sourceKey: string, raw: string | null): LegacySummary | null {
  const data = parseLegacy(raw);
  if (!data || raw === null) return null;
  const n = (f: EntityField) => (Array.isArray(data[f]) ? (data[f] as unknown[]).length : 0);
  return {
    sourceKey,
    hash: hashString(raw),
    workspaceName: String((data.workspace as { name: string }).name),
    counts: {
      stages: n("stages"),
      tasks: n("tasks"),
      budgetItems: n("budgetItems"),
      vendors: n("vendors"),
      guests: n("guests"),
      seserahan: n("seserahan"),
    },
  };
}

// ---------------------------------------------------------------- arsip / cadangan

export interface ArchiveResult {
  archived: string[]; // arsip baru yang dibuat
  alreadyArchived: string[]; // sudah ada (isi sama), tidak dibuat ulang
  failed: string[];
}

/**
 * Menyalin tiap key lama ke arsip terisolasi (tanpa pemilik). Idempoten: isi yang sama
 * tidak diarsipkan dua kali; isi yang berubah menjadi arsip baru. SUMBER TIDAK DISENTUH.
 */
export function archiveLegacyData(storage: StorageLike | null, now: Date = new Date()): ArchiveResult {
  const result: ArchiveResult = { archived: [], alreadyArchived: [], failed: [] };
  if (!storage) return result;
  for (const sourceKey of findLegacyKeys(storage)) {
    try {
      const raw = storage.getItem(sourceKey);
      if (raw === null) continue;
      const archiveKey = `${ARCHIVE_PREFIX}${sourceKey}#${hashString(raw)}`;
      if (storage.getItem(archiveKey) !== null) {
        result.alreadyArchived.push(archiveKey);
        continue;
      }
      storage.setItem(archiveKey, JSON.stringify({ sourceKey, archivedAt: now.toISOString(), raw }));
      result.archived.push(archiveKey);
    } catch {
      result.failed.push(sourceKey);
    }
  }
  return result;
}

export interface BackupFile {
  filename: string;
  content: string;
}

/**
 * Isi file cadangan yang dapat diunduh pengguna: seluruh data lama apa adanya.
 * Pemulihan: lihat CATATAN-ISOLASI-DATA.md (tiap entri berisi sourceKey + raw).
 */
export function buildBackupFile(storage: StorageLike | null, now: Date = new Date()): BackupFile | null {
  const entries = findLegacyKeys(storage)
    .map((sourceKey) => ({ sourceKey, raw: storage?.getItem(sourceKey) ?? null }))
    .filter((e): e is { sourceKey: string; raw: string } => e.raw !== null);
  if (entries.length === 0) return null;
  return {
    filename: `lanila-wedding-backup-${now.toISOString().slice(0, 10)}.json`,
    content: JSON.stringify({ app: "lanila-wedding-planner", kind: "legacy-backup", exportedAt: now.toISOString(), entries }, null, 2),
  };
}

// ---------------------------------------------------------------- keputusan pengguna

function readJson<T>(storage: StorageLike, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Data lama yang masih relevan untuk ditawarkan ke akun ini (dapat dibaca, belum ditolak). */
export function scanLegacy(storage: StorageLike | null, userId: string): LegacySummary[] {
  if (!storage || !userId) return [];
  const dismissed = new Set(readJson<string[]>(storage, dismissedKey(userId)) ?? []);
  const out: LegacySummary[] = [];
  for (const key of findLegacyKeys(storage)) {
    let summary: LegacySummary | null = null;
    try {
      summary = summarizeLegacy(key, storage.getItem(key));
    } catch {
      summary = null;
    }
    if (summary && !dismissed.has(summary.hash)) out.push(summary);
  }
  return out;
}

/** Pengguna memilih "jangan impor": jangan tawarkan lagi isi yang sama untuk akun ini. */
export function dismissLegacy(storage: StorageLike | null, userId: string): void {
  if (!storage || !userId) return;
  try {
    const hashes = new Set(readJson<string[]>(storage, dismissedKey(userId)) ?? []);
    for (const s of scanLegacy(storage, userId)) hashes.add(s.hash);
    storage.setItem(dismissedKey(userId), JSON.stringify([...hashes]));
  } catch {
    // diabaikan: paling buruk tawarannya muncul lagi
  }
}

// ---------------------------------------------------------------- impor

export type ImportResult =
  | { ok: true; workspaceId: string; alreadyImported: boolean }
  | { ok: false; reason: "no-session" | "not-legacy-key" | "source-missing" | "source-invalid" | "already-has-data" | "verification-failed" };

function convertLegacy(data: Record<string, unknown>, userId: string): UserData {
  const w = data.workspace as Record<string, unknown>;
  const id = newId("wk");
  const list = <T extends { workspaceId?: string }>(f: EntityField): T[] =>
    (Array.isArray(data[f]) ? (data[f] as T[]) : []).map((e) => ({ ...e, workspaceId: id }));
  const workspace: WeddingWorkspace = {
    id,
    ownerId: userId,
    name: String(w.name).trim(),
    weddingDate: typeof w.weddingDate === "string" && w.weddingDate ? w.weddingDate : undefined,
    weddingType: typeof w.weddingType === "string" && w.weddingType ? w.weddingType : "Akad & Resepsi",
    venue: typeof w.venue === "string" && w.venue ? w.venue : undefined,
    targetBudget: typeof w.targetBudget === "number" && w.targetBudget >= 0 ? Math.round(w.targetBudget) : 0,
  };
  return {
    ...emptyUserData(),
    workspace,
    stages: list("stages"),
    tasks: list("tasks"),
    budgetItems: list("budgetItems"),
    vendors: list("vendors"),
    guests: list("guests"),
    seserahan: list("seserahan"),
    activityLog: list("activityLog"),
    // data "members" (kolaborasi) dari versi lama sengaja TIDAK dibawa
  };
}

/**
 * Mengimpor satu key lama ke akun userId. Hanya dipanggil atas keputusan pengguna.
 * Tidak pernah mengubah/menghapus key lama dan tidak pernah menimpa data akun.
 */
export function importLegacy(storage: StorageLike | null, userId: string, sourceKey: string): ImportResult {
  if (!storage || !userId) return { ok: false, reason: "no-session" };
  // Hanya key lama yang boleh diimpor: tidak boleh menarik data akun lain (lanila-wp:v2:<id>).
  if (!isLegacyKey(sourceKey)) return { ok: false, reason: "not-legacy-key" };

  const raw = storage.getItem(sourceKey);
  if (raw === null) return { ok: false, reason: "source-missing" };
  const data = parseLegacy(raw);
  if (!data) return { ok: false, reason: "source-invalid" };
  const hash = hashString(raw);

  const existing = loadUserData(storage, userId);
  if (existing.workspace) {
    const marker = readJson<{ sourceKey: string; hash: string; workspaceId: string }>(storage, importMarkerKey(userId));
    if (marker && marker.sourceKey === sourceKey && marker.hash === hash && marker.workspaceId === existing.workspace.id) {
      return { ok: true, workspaceId: existing.workspace.id, alreadyImported: true }; // idempoten
    }
    return { ok: false, reason: "already-has-data" }; // tidak menimpa proyek yang ada
  }

  const userKey = storageKey(userId);
  const previous = storage.getItem(userKey);
  const converted = convertLegacy(data, userId);
  saveUserData(storage, userId, converted);

  // Verifikasi: baca ulang dan cocokkan jumlah tiap kelompok data sebelum dinyatakan berhasil.
  const back = loadUserData(storage, userId);
  const verified =
    back.workspace?.id === converted.workspace?.id &&
    back.workspace?.ownerId === userId &&
    ENTITY_FIELDS.every((f) => back[f].length === converted[f].length);
  if (!verified) {
    try {
      if (previous === null) storage.removeItem(userKey);
      else storage.setItem(userKey, previous);
    } catch {
      // pemulihan gagal: tidak ada yang bisa dilakukan lebih jauh di sini
    }
    return { ok: false, reason: "verification-failed" };
  }

  try {
    storage.setItem(
      importMarkerKey(userId),
      JSON.stringify({ sourceKey, hash, workspaceId: converted.workspace!.id, importedAt: new Date().toISOString() })
    );
  } catch {
    // marker gagal ditulis: impor tetap sah (proyek sudah ada, jadi impor kedua ditolak oleh "already-has-data")
  }
  return { ok: true, workspaceId: converted.workspace!.id, alreadyImported: false };
}
