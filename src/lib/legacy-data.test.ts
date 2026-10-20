import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "@/test/memory-storage";
import {
  ARCHIVE_PREFIX,
  archiveLegacyData,
  buildBackupFile,
  dismissLegacy,
  findLegacyKeys,
  importLegacy,
  importMarkerKey,
  isLegacyKey,
  scanLegacy,
  summarizeLegacy,
} from "./legacy-data";
import { createWorkspace } from "./store-actions";
import { emptyUserData, loadUserData, saveUserData, storageKey } from "./user-storage";

const A = "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const KEY = "lanila-wp:wk_proyek_lama";

function legacyPayload() {
  return {
    workspace: { id: "wk_proyek_lama", name: "Proyek Lama Uji", weddingDate: "2027-01-01T00:00:00.000Z", weddingType: "Akad saja", venue: "Gedung Uji", targetBudget: 9000 },
    stages: [{ id: "s1", workspaceId: "wk_proyek_lama", name: "S", order: 1, items: [{ id: "i1", stageId: "s1", title: "T", status: "selesai" }] }],
    tasks: [{ id: "t1", workspaceId: "wk_proyek_lama", title: "Tugas", category: "Vendor", deadline: "2027-01-01", priority: "low", status: "todo" }],
    budgetItems: [], vendors: [{ id: "v1", workspaceId: "wk_proyek_lama", name: "Vendor Lama", category: "Catering", price: 1, dpAmount: 0, status: "booked" }],
    guests: [{ id: "g1", workspaceId: "wk_proyek_lama", name: "Tamu Lama", category: "x", pax: 1, rsvp: "hadir" }, { id: "g2", workspaceId: "wk_proyek_lama", name: "Tamu Dua", category: "x", pax: 1, rsvp: "belum" }],
    seserahan: [], activityLog: [{ id: "a1", workspaceId: "wk_proyek_lama", actorName: "Pelaku Lama", action: "x", objectLabel: "y", createdAt: "2026-01-01T00:00:00.000Z" }],
    members: [{ profileId: "p1", fullName: "Anggota Lama", role: "owner" }],
  };
}
const withLegacy = (extra: Record<string, string> = {}) => createMemoryStorage({ [KEY]: JSON.stringify(legacyPayload()), ...extra });

describe("mengenali key lama", () => {
  it("hanya key lama global; bukan key per akun, arsip, atau key lain", () => {
    expect(isLegacyKey("lanila-wp:wk_apa_saja")).toBe(true);
    expect(isLegacyKey(storageKey(A))).toBe(false);
    expect(isLegacyKey("lanila-wp:v3:future")).toBe(false);
    expect(isLegacyKey(`${ARCHIVE_PREFIX}lanila-wp:x#1`)).toBe(false);
    expect(isLegacyKey("sb-abc-auth-token")).toBe(false);
    expect(isLegacyKey("weddingData")).toBe(false);
  });

  it("findLegacyKeys memilah dari storage campuran", () => {
    const st = withLegacy({ [storageKey(A)]: "{}", "sb-abc-auth-token": "{}", weddingData: "{}" });
    expect(findLegacyKeys(st)).toEqual([KEY]);
  });
});

describe("ringkasan data lama", () => {
  it("membaca nama proyek dan jumlah data", () => {
    const s = summarizeLegacy(KEY, JSON.stringify(legacyPayload()));
    expect(s?.workspaceName).toBe("Proyek Lama Uji");
    expect(s?.counts.guests).toBe(2);
    expect(s?.counts.vendors).toBe(1);
  });

  it("JSON rusak / bentuk salah / tanpa nama proyek menghasilkan null", () => {
    for (const raw of [null, "{rusak", "[]", "123", JSON.stringify({ workspace: {} }), JSON.stringify({ workspace: { name: "X" }, vendors: "bukan-array" })]) {
      expect(summarizeLegacy(KEY, raw)).toBeNull();
    }
  });
});

describe("arsip / cadangan (hanya salinan)", () => {
  it("menyalin ke arsip dan TIDAK mengubah sumber", () => {
    const st = withLegacy();
    const before = st.getItem(KEY);
    const r = archiveLegacyData(st, new Date("2026-10-12T00:00:00Z"));
    expect(r.archived).toHaveLength(1);
    expect(st.getItem(KEY)).toBe(before);
    const entry = JSON.parse(st.getItem(r.archived[0]) as string);
    expect(entry.sourceKey).toBe(KEY);
    expect(entry.raw).toBe(before);
  });

  it("idempoten: dijalankan berulang tidak menggandakan arsip", () => {
    const st = withLegacy();
    archiveLegacyData(st);
    const second = archiveLegacyData(st);
    archiveLegacyData(st);
    expect(second.archived).toHaveLength(0);
    expect(second.alreadyArchived).toHaveLength(1);
    expect(Object.keys(st.dump()).filter((k) => k.startsWith(ARCHIVE_PREFIX))).toHaveLength(1);
  });

  it("isi sumber berubah: arsip baru dibuat, arsip lama tetap ada", () => {
    const st = withLegacy();
    archiveLegacyData(st);
    st.setItem(KEY, JSON.stringify({ ...legacyPayload(), workspace: { ...legacyPayload().workspace, name: "Diubah" } }));
    archiveLegacyData(st);
    expect(Object.keys(st.dump()).filter((k) => k.startsWith(ARCHIVE_PREFIX))).toHaveLength(2);
  });

  it("kegagalan menulis tidak melempar error dan tidak menghapus apa pun", () => {
    const st = withLegacy();
    const broken = { ...st, setItem() { throw new Error("quota"); }, get length() { return st.length; }, key: st.key };
    expect(() => archiveLegacyData(broken)).not.toThrow();
    expect(st.getItem(KEY)).not.toBeNull();
  });

  it("file cadangan berisi data lama apa adanya; null jika tidak ada data lama", () => {
    expect(buildBackupFile(createMemoryStorage())).toBeNull();
    const f = buildBackupFile(withLegacy(), new Date("2026-10-12T05:00:00Z"));
    expect(f?.filename).toBe("lanila-wedding-backup-2026-10-12.json");
    const parsed = JSON.parse(f?.content as string);
    expect(parsed.entries[0].sourceKey).toBe(KEY);
    expect(JSON.parse(parsed.entries[0].raw).workspace.name).toBe("Proyek Lama Uji");
  });
});

describe("penawaran ke akun", () => {
  it("tanpa akun tidak menawarkan apa pun; akun yang menolak tidak ditawari isi yang sama lagi", () => {
    const st = withLegacy();
    expect(scanLegacy(st, "")).toEqual([]);
    expect(scanLegacy(st, A)).toHaveLength(1);
    dismissLegacy(st, A);
    expect(scanLegacy(st, A)).toHaveLength(0);
    expect(scanLegacy(st, B)).toHaveLength(1); // keputusan A tidak berlaku untuk B
  });

  it("isi lama yang berubah ditawarkan lagi", () => {
    const st = withLegacy();
    dismissLegacy(st, A);
    st.setItem(KEY, JSON.stringify({ ...legacyPayload(), workspace: { ...legacyPayload().workspace, name: "Isi Baru" } }));
    expect(scanLegacy(st, A)).toHaveLength(1);
  });
});

describe("impor atas keputusan pengguna", () => {
  it("mengimpor menjadi milik akun, id dan workspaceId baru, tanpa members, sumber utuh", () => {
    const st = withLegacy();
    const before = st.getItem(KEY);
    const r = importLegacy(st, A, KEY);
    expect(r.ok).toBe(true);
    const d = loadUserData(st, A);
    expect(d.workspace?.ownerId).toBe(A);
    expect(d.workspace?.name).toBe("Proyek Lama Uji");
    expect(d.workspace?.id).not.toBe("wk_proyek_lama");
    expect(d.guests).toHaveLength(2);
    expect(d.vendors).toHaveLength(1);
    expect(d.stages[0].items[0].status).toBe("selesai");
    expect([...d.stages, ...d.tasks, ...d.vendors, ...d.guests, ...d.activityLog].every((e) => e.workspaceId === d.workspace?.id)).toBe(true);
    expect(JSON.stringify(d)).not.toContain("Anggota Lama"); // data kolaborasi tidak dibawa
    expect(st.getItem(KEY)).toBe(before); // sumber tidak berubah / tidak dihapus
    expect(st.getItem(importMarkerKey(A))).not.toBeNull();
  });

  it("idempoten: impor kedua tidak menggandakan atau menimpa", () => {
    const st = withLegacy();
    const first = importLegacy(st, A, KEY);
    const snapshot = st.getItem(storageKey(A));
    const second = importLegacy(st, A, KEY);
    expect(first.ok && second.ok).toBe(true);
    expect(second.ok && second.alreadyImported).toBe(true);
    expect(second.ok && first.ok && second.workspaceId === first.workspaceId).toBe(true);
    expect(st.getItem(storageKey(A))).toBe(snapshot);
  });

  it("tidak menimpa akun yang sudah punya proyek sendiri", () => {
    const st = withLegacy();
    saveUserData(st, A, createWorkspace(emptyUserData(), A, { name: "Proyek Milik A", targetBudget: 1, weddingType: "x" }));
    const before = st.getItem(storageKey(A));
    const r = importLegacy(st, A, KEY);
    expect(r).toEqual({ ok: false, reason: "already-has-data" });
    expect(st.getItem(storageKey(A))).toBe(before);
  });

  it("menolak sumber yang bukan key lama (tidak bisa menarik data akun lain)", () => {
    const st = withLegacy();
    saveUserData(st, B, createWorkspace(emptyUserData(), B, { name: "Proyek Milik B", targetBudget: 1, weddingType: "x" }));
    const r = importLegacy(st, A, storageKey(B));
    expect(r).toEqual({ ok: false, reason: "not-legacy-key" });
    expect(loadUserData(st, A).workspace).toBeNull();
  });

  it("tanpa sesi, sumber hilang, atau sumber tidak valid", () => {
    expect(importLegacy(withLegacy(), "", KEY)).toEqual({ ok: false, reason: "no-session" });
    expect(importLegacy(createMemoryStorage(), A, KEY)).toEqual({ ok: false, reason: "source-missing" });
    const st = createMemoryStorage({ [KEY]: "{rusak" });
    expect(importLegacy(st, A, KEY)).toEqual({ ok: false, reason: "source-invalid" });
    expect(loadUserData(st, A).workspace).toBeNull();
  });

  it("verifikasi gagal: dibatalkan, isi akun dipulihkan, tidak ada penanda sukses", () => {
    const st = withLegacy();
    // storage yang "lupa" menyimpan data akun (menyimulasikan kuota penuh yang diam-diam gagal)
    const flaky = {
      getItem: st.getItem, removeItem: st.removeItem, get length() { return st.length; }, key: st.key,
      setItem: (k: string, v: string) => { if (!k.startsWith("lanila-wp:v")) st.setItem(k, v); },
    };
    const r = importLegacy(flaky, A, KEY);
    expect(r).toEqual({ ok: false, reason: "verification-failed" });
    expect(loadUserData(st, A).workspace).toBeNull();
    expect(st.getItem(importMarkerKey(A))).toBeNull();
    expect(st.getItem(KEY)).not.toBeNull();
  });

  it("dua akun yang sama-sama memilih impor mendapat salinan terpisah; data satu akun tidak berubah oleh akun lain", () => {
    const st = withLegacy();
    importLegacy(st, A, KEY);
    const aBefore = st.getItem(storageKey(A));
    importLegacy(st, B, KEY);
    expect(st.getItem(storageKey(A))).toBe(aBefore);
    expect(loadUserData(st, B).workspace?.ownerId).toBe(B);
    expect(loadUserData(st, A).workspace?.id).not.toBe(loadUserData(st, B).workspace?.id);
  });
});
