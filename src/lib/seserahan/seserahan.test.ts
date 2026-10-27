import { describe, expect, it } from "vitest";
import {
  DEFAULT_SESERAHAN_FILTERS,
  SESERAHAN_CATEGORIES,
  filterAndSortSeserahan,
  hasActiveSeserahanFilters,
  itemErrorMessage,
  parseRupiah,
  quantityOf,
  seserahanCategories,
  summarizeSeserahan,
  validateSeserahanInput,
  type RawSeserahanInput,
} from "./seserahan";
import { addSeserahan, createWorkspace, deleteSeserahan, setSeserahanStatus, updateSeserahan } from "./store-actions";
import { emptyUserData, type UserData } from "./user-storage";
import type { SeserahanItem } from "./types";

const U = "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ctx = { actorName: "Akun Uji", now: new Date("2026-10-12T03:00:00Z") };
const raw = (o: Partial<RawSeserahanInput> = {}): RawSeserahanInput => ({ name: "Mukena", category: "Pakaian", quantity: "1", plannedBudget: "350.000", status: "belum", actualCost: "", purchaseDate: "", notes: "", ...o });
const it_ = (id: string, name: string, status: SeserahanItem["status"], planned: number, actual = 0, category = "Pakaian"): SeserahanItem => ({ id, workspaceId: "w", name, category, plannedBudget: planned, actualCost: actual, status });
const withWorkspace = (): UserData => createWorkspace(emptyUserData(), U, { name: "Proyek Uji", targetBudget: 0, weddingType: "x" });

const SAMPLE: SeserahanItem[] = [
  it_("1", "Sajadah", "dibeli", 200_000, 180_000, "Perlengkapan Ibadah"),
  it_("2", "Kosmetik", "diproses", 500_000, 0, "Perawatan Diri"),
  it_("3", "Aksesori rambut", "belum", 150_000, 0, "Aksesori"),
  it_("4", "Mukena", "dibeli", 350_000, 400_000, "Perlengkapan Ibadah"),
];

describe("membaca rupiah", () => {
  it("kosong = 0; angka polos, titik ribuan, dan awalan Rp diterima", () => {
    for (const [t, v] of [["", 0], ["   ", 0], ["0", 0], ["1500000", 1500000], ["1.500.000", 1500000], ["Rp 1.500.000", 1500000], ["rp1.500.000", 1500000], ["350.000", 350000], ["10000000000", 10_000_000_000]] as const) {
      expect(parseRupiah(t)).toEqual({ value: v });
    }
  });

  it("biaya negatif ditolak dengan pesan yang jelas (bukan hanya pesan format umum)", () => {
    expect(parseRupiah("-5000")).toEqual({ error: "Biaya tidak boleh negatif." });
    expect(parseRupiah("Rp -1")).toEqual({ error: "Biaya tidak boleh negatif." });
    expect(parseRupiah(" -0")).toEqual({ error: "Biaya tidak boleh negatif." });
  });

  it("menolak negatif, huruf, pecahan, pemisah ribuan yang salah, dan nilai terlalu besar", () => {
    for (const bad of ["-5000", "abc", "1.5", "1500000,50", "1.50.000", "12.34", "10000000001", "Rp -1"]) {
      expect("error" in parseRupiah(bad)).toBe(true);
    }
  });
});

describe("validasi form seserahan", () => {
  it("input valid dibersihkan menjadi angka dan nilai opsional undefined", () => {
    const { errors, value } = validateSeserahanInput(raw({ name: "  Mukena   putih ", quantity: " 2 ", plannedBudget: "Rp 350.000" }));
    expect(errors).toEqual({});
    expect(value).toEqual({ name: "Mukena putih", category: "Pakaian", quantity: 2, plannedBudget: 350000, status: "belum", actualCost: 0, purchaseDate: undefined, notes: undefined });
  });

  it("nama wajib dan dibatasi 100 karakter", () => {
    expect(validateSeserahanInput(raw({ name: "  " })).errors.name).toBeTruthy();
    expect(validateSeserahanInput(raw({ name: "x".repeat(101) })).errors.name).toBeTruthy();
    expect(validateSeserahanInput(raw({ name: "x".repeat(100) })).errors.name).toBeUndefined();
  });

  it("jumlah harus bilangan bulat 1–999", () => {
    for (const bad of ["", "0", "-1", "1000", "1.5", "abc"]) expect(validateSeserahanInput(raw({ quantity: bad })).errors.quantity).toBeTruthy();
    for (const ok of ["1", "999", 5]) expect(validateSeserahanInput(raw({ quantity: ok })).errors.quantity).toBeUndefined();
  });

  it("biaya negatif atau tidak valid ditolak (estimasi dan biaya sebenarnya)", () => {
    expect(validateSeserahanInput(raw({ plannedBudget: "-1" })).errors.plannedBudget).toBeTruthy();
    expect(validateSeserahanInput(raw({ actualCost: "-1" })).errors.actualCost).toBeTruthy();
    expect(validateSeserahanInput(raw({ plannedBudget: "abc" })).value).toBeNull();
  });

  it("status, tanggal, kategori, dan catatan divalidasi", () => {
    expect(validateSeserahanInput(raw({ status: "selesai" })).errors.status).toBeTruthy();
    expect(validateSeserahanInput(raw({ purchaseDate: "2026-13-45" })).errors.purchaseDate).toBeTruthy();
    expect(validateSeserahanInput(raw({ purchaseDate: "2026-10-12" })).errors.purchaseDate).toBeUndefined();
    expect(validateSeserahanInput(raw({ category: "" })).errors.category).toBeTruthy();
    expect(validateSeserahanInput(raw({ notes: "x".repeat(301) })).errors.notes).toBeTruthy();
  });

  it("biaya sebenarnya dan tanggal tetap dibawa walau status bukan 'dibeli' (tidak hilang saat status diubah)", () => {
    const { value } = validateSeserahanInput(raw({ status: "belum", actualCost: "250.000", purchaseDate: "2026-10-12" }));
    expect(value?.actualCost).toBe(250000);
    expect(value?.purchaseDate).toBe("2026-10-12");
  });

  it("setiap jenis galat punya pesan", () => {
    for (const e of ["no-workspace", "validation", "not-found", "storage"] as const) expect(itemErrorMessage(e).length).toBeGreaterThan(10);
  });
});

describe("ringkasan & progres", () => {
  it("hanya status 'dibeli' (Sudah Disiapkan) yang dihitung selesai", () => {
    const s = summarizeSeserahan(SAMPLE);
    expect([s.total, s.done, s.inProgress, s.notBought]).toEqual([4, 2, 1, 1]);
    expect(s.percent).toBe(50);
  });

  it("sudah disiapkan + dalam persiapan + belum dibeli selalu sama dengan total", () => {
    for (const list of [[], SAMPLE, [it_("1", "A", "belum", 1)], [it_("1", "A", "dibeli", 1), it_("2", "B", "dibeli", 2)]]) {
      const s = summarizeSeserahan(list);
      expect(s.done + s.inProgress + s.notBought).toBe(s.total);
    }
  });

  it("estimasi = jumlah estimasi SEMUA item; realisasi = biaya sebenarnya HANYA item yang sudah disiapkan", () => {
    const s = summarizeSeserahan([...SAMPLE, it_("5", "Belum dibeli tapi ada isian", "belum", 100_000, 999_999)]);
    expect(s.estimated).toBe(200_000 + 500_000 + 150_000 + 350_000 + 100_000);
    expect(s.actual).toBe(180_000 + 400_000); // 999.999 pada item belum dibeli TIDAK dihitung
  });

  it("tanpa item: nol di semua angka, tanpa pembagian nol", () => {
    expect(summarizeSeserahan([])).toEqual({ total: 0, done: 0, inProgress: 0, notBought: 0, percent: 0, estimated: 0, actual: 0 });
  });

  it("persentase dibulatkan: 1/3 = 33, 2/3 = 67, semua selesai = 100", () => {
    const mk = (n: number, d: number) => Array.from({ length: d }, (_, i) => it_(String(i), `I${i}`, i < n ? "dibeli" : "belum", 1));
    expect(summarizeSeserahan(mk(1, 3)).percent).toBe(33);
    expect(summarizeSeserahan(mk(2, 3)).percent).toBe(67);
    expect(summarizeSeserahan(mk(3, 3)).percent).toBe(100);
  });

  it("jumlah barang: item lama tanpa field dianggap 1", () => {
    expect(quantityOf(it_("1", "A", "belum", 1))).toBe(1);
    expect(quantityOf({ ...it_("1", "A", "belum", 1), quantity: 4 })).toBe(4);
    expect(quantityOf({ ...it_("1", "A", "belum", 1), quantity: 0 })).toBe(1);
  });
});

describe("pencarian, filter, dan urutan", () => {
  const names = (l: SeserahanItem[]) => l.map((x) => x.name);
  const f = (o: object) => ({ ...DEFAULT_SESERAHAN_FILTERS, ...o });

  it("cari nama (tanpa peduli huruf besar), filter kategori, filter status, dan gabungannya", () => {
    expect(names(filterAndSortSeserahan(SAMPLE, f({ query: "  MUKENA " })))).toEqual(["Mukena"]);
    expect(names(filterAndSortSeserahan(SAMPLE, f({ category: "Perlengkapan Ibadah" })))).toEqual(["Mukena", "Sajadah"]);
    expect(names(filterAndSortSeserahan(SAMPLE, f({ status: "dibeli" })))).toEqual(["Mukena", "Sajadah"]);
    expect(names(filterAndSortSeserahan(SAMPLE, f({ status: "dibeli", category: "Perlengkapan Ibadah", query: "saj" })))).toEqual(["Sajadah"]);
    expect(filterAndSortSeserahan(SAMPLE, f({ status: "belum", category: "Pakaian" }))).toEqual([]);
  });

  it("semua urutan", () => {
    const sort = (s: string) => names(filterAndSortSeserahan(SAMPLE, f({ sort: s })));
    expect(sort("name-asc")).toEqual(["Aksesori rambut", "Kosmetik", "Mukena", "Sajadah"]);
    expect(sort("newest")).toEqual(["Mukena", "Aksesori rambut", "Kosmetik", "Sajadah"]);
    expect(sort("cost-desc")).toEqual(["Kosmetik", "Mukena", "Sajadah", "Aksesori rambut"]);
    expect(sort("status")).toEqual(["Aksesori rambut", "Kosmetik", "Mukena", "Sajadah"]);
  });

  it("filter aktif mengabaikan urutan; array asli tidak berubah; kategori = bawaan + yang dipakai", () => {
    const copy = JSON.stringify(SAMPLE);
    filterAndSortSeserahan(SAMPLE, f({ sort: "cost-desc" }));
    expect(JSON.stringify(SAMPLE)).toBe(copy);
    expect(hasActiveSeserahanFilters(DEFAULT_SESERAHAN_FILTERS)).toBe(false);
    expect(hasActiveSeserahanFilters(f({ sort: "status" }))).toBe(false);
    expect(hasActiveSeserahanFilters(f({ query: "x" }))).toBe(true);
    const cats = seserahanCategories([it_("1", "A", "belum", 1, 0, "Kategori Lama")]);
    expect(cats).toContain("Kategori Lama");
    for (const c of SESERAHAN_CATEGORIES) expect(cats).toContain(c);
  });
});

describe("tambah, ubah, hapus item (aksi murni)", () => {
  it("menambah item dengan jumlah dan biaya, mencatat aktivitas, tidak memutasi data awal", () => {
    const d = withWorkspace();
    const r = addSeserahan(d, raw({ quantity: "3", plannedBudget: "1.200.000" }), ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([r.item.quantity, r.item.plannedBudget, r.item.workspaceId]).toEqual([3, 1_200_000, d.workspace?.id]);
    expect(r.data.activityLog[0].action).toBe("menambahkan item seserahan");
    expect(d.seserahan).toHaveLength(0);
  });

  it("input tidak valid atau tanpa proyek ditolak tanpa mengubah data", () => {
    const d = withWorkspace();
    const bad = addSeserahan(d, raw({ name: "", plannedBudget: "-5" }), ctx);
    expect(!bad.ok && bad.error).toBe("validation");
    expect(!bad.ok && bad.errors?.name && bad.errors?.plannedBudget).toBeTruthy();
    expect(addSeserahan(emptyUserData(), raw(), ctx)).toEqual({ ok: false, error: "no-workspace" });
  });

  it("ubah: mempertahankan kolom lain, mengosongkan catatan, dan tidak menghilangkan biaya sebenarnya saat status diubah", () => {
    const added = addSeserahan(withWorkspace(), raw({ status: "dibeli", actualCost: "300.000", purchaseDate: "2026-10-12", notes: "catatan" }), ctx);
    if (!added.ok) throw new Error("harus ok");
    const withExtra = { ...added.data, seserahan: added.data.seserahan.map((i) => ({ ...i, extra: "dipertahankan" })) } as UserData;
    // status dikembalikan ke "belum": bidang biaya sebenarnya disembunyikan di form tetapi nilainya tetap dikirim
    const r = updateSeserahan(withExtra, added.item.id, raw({ name: "Mukena putih", status: "belum", actualCost: "300000", purchaseDate: "2026-10-12", notes: "" }), ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const item = r.item as SeserahanItem & { extra?: string };
    expect([item.id, item.name, item.status, item.actualCost, item.purchaseDate, item.notes, item.extra]).toEqual([added.item.id, "Mukena putih", "belum", 300000, "2026-10-12", undefined, "dipertahankan"]);
    expect(r.data.seserahan).toHaveLength(1);
  });

  it("ubah/hapus/status dengan id tidak dikenal → not-found", () => {
    const d = withWorkspace();
    expect(updateSeserahan(d, "x", raw(), ctx)).toEqual({ ok: false, error: "not-found" });
    expect(deleteSeserahan(d, "x", ctx)).toEqual({ ok: false, error: "not-found" });
    expect(setSeserahanStatus(d, "x", "dibeli", ctx)).toEqual({ ok: false, error: "not-found" });
  });

  it("hapus hanya item yang dipilih; status tercatat di aktivitas", () => {
    let d = withWorkspace();
    for (const n of ["A", "B", "C"]) {
      const r = addSeserahan(d, raw({ name: n }), ctx);
      if (!r.ok) throw new Error("harus ok");
      d = r.data;
    }
    const del = deleteSeserahan(d, d.seserahan[1].id, ctx);
    expect(del.ok && del.data.seserahan.map((i) => i.name)).toEqual(["A", "C"]);
    const st = setSeserahanStatus(d, d.seserahan[0].id, "dibeli", ctx);
    expect(st.ok && st.data.seserahan[0].status).toBe("dibeli");
    expect(st.ok && st.data.activityLog[0].action).toBe("menandai sudah disiapkan");
  });
});
