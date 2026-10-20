import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "@/test/memory-storage";
import { createWorkspace } from "./store-actions";
import {
  emptyUserData,
  isOwnStorageEvent,
  listStorageKeys,
  loadUserData,
  saveUserData,
  storageKey,
} from "./user-storage";

const A = "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const C = "33333333-cccc-4ccc-8ccc-cccccccccccc";

function project(userId: string, name: string) {
  return createWorkspace(emptyUserData(), userId, { name, targetBudget: 1000, weddingType: "Akad & Resepsi" });
}

describe("penyimpanan per akun", () => {
  it("akun baru: data kosong, tanpa data contoh", () => {
    const d = loadUserData(createMemoryStorage(), C);
    expect(d.workspace).toBeNull();
    expect(d.stages).toHaveLength(0);
    expect(d.vendors).toHaveLength(0);
    expect(d.activityLog).toHaveLength(0);
  });

  it("A dan B terpisah di storage yang sama, dan A kembali utuh", () => {
    const st = createMemoryStorage();
    saveUserData(st, A, project(A, "Proyek Alpha"));
    saveUserData(st, B, project(B, "Proyek Beta"));
    expect(loadUserData(st, A).workspace?.name).toBe("Proyek Alpha");
    expect(loadUserData(st, B).workspace?.name).toBe("Proyek Beta");
    expect(loadUserData(st, C).workspace).toBeNull();
  });

  it("key memuat id akun", () => {
    expect(storageKey(A)).toContain(A);
    expect(storageKey(A)).not.toBe(storageKey(B));
  });

  it("data A yang disalin ke key B ditolak (ownerId tidak cocok)", () => {
    const st = createMemoryStorage();
    saveUserData(st, A, project(A, "Proyek Alpha"));
    st.setItem(storageKey(B), st.getItem(storageKey(A)) as string);
    expect(loadUserData(st, B).workspace).toBeNull();
  });

  it("menolak menulis data yang pemiliknya bukan akun itu", () => {
    const st = createMemoryStorage();
    saveUserData(st, B, project(A, "Proyek Alpha"));
    expect(st.getItem(storageKey(B))).toBeNull();
  });

  it("tanpa id akun (tanpa sesi) tidak membaca dan tidak menulis apa pun", () => {
    const st = createMemoryStorage();
    saveUserData(st, A, project(A, "Proyek Alpha"));
    expect(loadUserData(st, "").workspace).toBeNull();
    const before = st.writes;
    saveUserData(st, "", project(A, "X"));
    expect(st.writes).toBe(before);
  });

  it("JSON rusak, versi lama, atau bentuk salah menghasilkan data kosong tanpa crash", () => {
    const st = createMemoryStorage();
    for (const raw of ["{rusak", "null", "123", JSON.stringify({ version: 1 }), JSON.stringify({ version: 2, workspace: null })]) {
      st.setItem(storageKey(A), raw);
      expect(loadUserData(st, A).workspace).toBeNull();
    }
  });

  it("data rusak milik satu akun tidak menghapus data akun lain", () => {
    const st = createMemoryStorage();
    saveUserData(st, B, project(B, "Proyek Beta"));
    st.setItem(storageKey(A), "{rusak");
    expect(loadUserData(st, A).workspace).toBeNull();
    expect(loadUserData(st, B).workspace?.name).toBe("Proyek Beta");
  });

  it("storage null atau yang melempar error tidak membuat crash", () => {
    expect(loadUserData(null, A).workspace).toBeNull();
    const bad = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
      removeItem() {},
    };
    expect(loadUserData(bad, A).workspace).toBeNull();
    expect(() => saveUserData(bad, A, project(A, "X"))).not.toThrow();
  });

  it("tidak menulis ulang jika isinya sama (mencegah gema antar-tab)", () => {
    const st = createMemoryStorage();
    const d = project(A, "Proyek Alpha");
    saveUserData(st, A, d);
    const w = st.writes;
    saveUserData(st, A, d);
    saveUserData(st, A, { ...d });
    expect(st.writes).toBe(w);
  });
});

describe("event storage dari tab lain", () => {
  it("hanya key akun ini (atau clear()) yang memicu muat ulang", () => {
    expect(isOwnStorageEvent(storageKey(A), A)).toBe(true);
    expect(isOwnStorageEvent(null, A)).toBe(true);
    expect(isOwnStorageEvent(storageKey(B), A)).toBe(false);
    expect(isOwnStorageEvent("sb-xyz-auth-token", A)).toBe(false);
  });

  it("listStorageKeys membaca semua key; storage tanpa enumerasi menghasilkan kosong", () => {
    const st = createMemoryStorage({ a: "1", b: "2" });
    expect(listStorageKeys(st).sort()).toEqual(["a", "b"]);
    expect(listStorageKeys(null)).toEqual([]);
    expect(listStorageKeys({ getItem: () => null, setItem() {}, removeItem() {} })).toEqual([]);
  });
});
