/**
 * Penyimpanan lokal data pernikahan, TERPISAH PER AKUN.
 *
 * Kunci localStorage memuat id akun (lanila-wp:v2:<userId>), jadi akun yang
 * berbeda tidak pernah membaca atau menimpa data satu sama lain. Data juga
 * memuat ownerId dan divalidasi saat dibaca: data milik akun lain ditolak
 * walaupun kuncinya tertukar atau disalin.
 *
 * PENTING: localStorage BUKAN batas keamanan (siapa pun yang memegang browser
 * bisa membukanya lewat DevTools). Batas keamanan sebenarnya adalah RLS di
 * database (lihat supabase/01_wedding_user_isolation.sql).
 */

import type {
  ActivityLogEntry,
  BudgetItem,
  Guest,
  PreparationStage,
  SeserahanItem,
  Vendor,
  WeddingTask,
  WeddingWorkspace,
} from "./types";

export const STORAGE_VERSION = 2;

export interface UserData {
  version: typeof STORAGE_VERSION;
  workspace: WeddingWorkspace | null;
  stages: PreparationStage[];
  tasks: WeddingTask[];
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  guests: Guest[];
  seserahan: SeserahanItem[];
  activityLog: ActivityLogEntry[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** Opsional: window.localStorage punya keduanya. Dipakai untuk mendeteksi data lama. */
  readonly length?: number;
  key?(index: number): string | null;
}

/** localStorage browser, atau null jika tidak tersedia / diblokir (mis. SSR, mode privat ketat). */
export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Semua key di storage (kosong jika storage tidak mendukung enumerasi). */
export function listStorageKeys(storage: StorageLike | null): string[] {
  if (!storage || typeof storage.length !== "number" || typeof storage.key !== "function") return [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k) keys.push(k);
    }
  } catch {
    return [];
  }
  return keys;
}

/**
 * Apakah event "storage" dari tab lain menyangkut data akun ini?
 * key === null berarti localStorage.clear() di tab lain.
 */
export function isOwnStorageEvent(eventKey: string | null, userId: string): boolean {
  return eventKey === null || eventKey === storageKey(userId);
}

const ARRAY_FIELDS = [
  "stages",
  "tasks",
  "budgetItems",
  "vendors",
  "guests",
  "seserahan",
  "activityLog",
] as const;

export function storageKey(userId: string): string {
  return `lanila-wp:v${STORAGE_VERSION}:${userId}`;
}

export function emptyUserData(): UserData {
  return {
    version: STORAGE_VERSION,
    workspace: null,
    stages: [],
    tasks: [],
    budgetItems: [],
    vendors: [],
    guests: [],
    seserahan: [],
    activityLog: [],
  };
}

/** Parse + validasi. Mengembalikan null jika rusak, versi lama, atau bukan milik userId. */
export function parseUserData(raw: string | null, userId: string): UserData | null {
  if (!raw || !userId) return null;
  try {
    const data = JSON.parse(raw) as Partial<UserData> | null;
    if (!data || typeof data !== "object" || data.version !== STORAGE_VERSION) return null;
    for (const field of ARRAY_FIELDS) {
      if (!Array.isArray(data[field])) return null;
    }
    if (data.workspace != null) {
      if (typeof data.workspace !== "object" || data.workspace.ownerId !== userId) return null;
    }
    return data as UserData;
  } catch {
    return null;
  }
}

/** Data milik userId, atau data kosong jika belum ada / tidak valid. Tidak pernah memakai data contoh. */
export function loadUserData(storage: StorageLike | null, userId: string): UserData {
  if (!storage || !userId) return emptyUserData();
  try {
    return parseUserData(storage.getItem(storageKey(userId)), userId) ?? emptyUserData();
  } catch {
    return emptyUserData();
  }
}

export function saveUserData(storage: StorageLike | null, userId: string, data: UserData): void {
  if (!storage || !userId) return;
  // Pengaman terakhir: jangan pernah menulis data yang pemiliknya bukan userId ini.
  if (data.workspace && data.workspace.ownerId !== userId) return;
  try {
    const key = storageKey(userId);
    const serialized = JSON.stringify(data);
    // Jangan menulis jika isinya sama: mencegah "gema" antar-tab dan tulis ulang yang sia-sia.
    if (storage.getItem(key) === serialized) return;
    storage.setItem(key, serialized);
  } catch {
    // kuota penuh / mode privat: abaikan, data tetap ada di memori selama sesi
  }
}
