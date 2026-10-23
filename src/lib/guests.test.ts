import { describe, expect, it } from "vitest";
import {
  DEFAULT_GUEST_FILTERS,
  GUEST_CATEGORIES,
  filterAndSortGuests,
  guestCategories,
  guestErrorMessage,
  hasActiveFilters,
  summarizeGuests,
  validateGuestInput,
  type RawGuestInput,
} from "./guests";
import { addGuest, createWorkspace, deleteGuest, setGuestRsvp, updateGuest } from "./store-actions";
import { emptyUserData, type UserData } from "./user-storage";
import type { Guest } from "./types";

const U = "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ctx = { actorName: "Akun Uji", now: new Date("2026-10-12T03:00:00Z") };
const raw = (over: Partial<RawGuestInput> = {}): RawGuestInput => ({ name: "Budi Santoso", category: "Teman", pax: "2", phone: "", rsvp: "belum", notes: "", ...over });
const g = (id: string, name: string, rsvp: Guest["rsvp"], pax: number, category = "Teman"): Guest => ({ id, workspaceId: "w", name, category, pax, rsvp });

const SAMPLE: Guest[] = [
  g("1", "Citra", "hadir", 2, "Keluarga"),
  g("2", "Andi", "belum", 4, "Teman"),
  g("3", "Budi", "tidak_hadir", 1, "Teman"),
  g("4", "dewi Lestari", "hadir", 3, "Rekan Kerja"),
];

function withWorkspace(): UserData {
  return createWorkspace(emptyUserData(), U, { name: "Proyek Uji", targetBudget: 0, weddingType: "x" });
}

describe("validasi form tamu", () => {
  it("input valid dibersihkan: spasi dirapikan, pax jadi angka, kolom opsional kosong menjadi undefined", () => {
    const { errors, value } = validateGuestInput(raw({ name: "  Budi   Santoso ", pax: " 3 " }), []);
    expect(errors).toEqual({});
    expect(value).toEqual({ name: "Budi Santoso", category: "Teman", pax: 3, phone: undefined, rsvp: "belum", notes: undefined });
  });

  it("nama wajib dan dibatasi panjangnya", () => {
    expect(validateGuestInput(raw({ name: "   " }), []).errors.name).toBeTruthy();
    expect(validateGuestInput(raw({ name: "x".repeat(101) }), []).errors.name).toBeTruthy();
    expect(validateGuestInput(raw({ name: "x".repeat(100) }), []).errors.name).toBeUndefined();
  });

  it("jumlah orang harus bilangan bulat 1–50", () => {
    for (const bad of ["", "0", "-1", "51", "1.5", "abc", " "]) expect(validateGuestInput(raw({ pax: bad }), []).errors.pax).toBeTruthy();
    for (const ok of ["1", "50", 7]) expect(validateGuestInput(raw({ pax: ok }), []).errors.pax).toBeUndefined();
  });

  it("telepon opsional; jika diisi harus 8–15 digit dengan karakter yang wajar", () => {
    expect(validateGuestInput(raw({ phone: "" }), []).errors.phone).toBeUndefined();
    for (const ok of ["081234567890", "0812-3456-7890", "+62 812 3456 7890", "(021) 555 1234"]) expect(validateGuestInput(raw({ phone: ok }), []).errors.phone).toBeUndefined();
    for (const bad of ["abc", "12345", "1234567890123456", "0812 abc 7890"]) expect(validateGuestInput(raw({ phone: bad }), []).errors.phone).toBeTruthy();
  });

  it("status harus salah satu dari tiga nilai; catatan dibatasi 300 karakter", () => {
    expect(validateGuestInput(raw({ rsvp: "mungkin" }), []).errors.rsvp).toBeTruthy();
    expect(validateGuestInput(raw({ notes: "x".repeat(301) }), []).errors.notes).toBeTruthy();
    expect(validateGuestInput(raw({ category: "" }), []).errors.category).toBeTruthy();
  });

  it("nama ganda ditolak tanpa peduli huruf besar/spasi, tetapi tamu yang sedang diubah tidak bentrok dengan dirinya", () => {
    expect(validateGuestInput(raw({ name: "  CITRA " }), SAMPLE).errors.name).toBeTruthy();
    expect(validateGuestInput(raw({ name: "Citra" }), SAMPLE, "1").errors.name).toBeUndefined();
    expect(validateGuestInput(raw({ name: "Citra" }), SAMPLE, "2").errors.name).toBeTruthy();
  });

  it("setiap jenis galat punya pesan untuk pengguna", () => {
    for (const e of ["no-workspace", "validation", "not-found", "storage"] as const) expect(guestErrorMessage(e).length).toBeGreaterThan(10);
  });
});

describe("pencarian, filter, dan urutan", () => {
  const names = (list: Guest[]) => list.map((x) => x.name);

  it("pencarian nama tidak peduli huruf besar dan memotong spasi", () => {
    expect(names(filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, query: "  DEWI " }))).toEqual(["dewi Lestari"]);
    expect(filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, query: "zzz" })).toEqual([]);
  });

  it("filter status, filter kelompok, dan gabungan ketiganya bekerja bersama", () => {
    expect(names(filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, status: "hadir" }))).toEqual(["Citra", "dewi Lestari"]);
    expect(names(filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, category: "Teman" }))).toEqual(["Andi", "Budi"]);
    expect(names(filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, status: "hadir", category: "Keluarga" }))).toEqual(["Citra"]);
    expect(filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, status: "hadir", category: "Teman" })).toEqual([]);
    expect(names(filterAndSortGuests(SAMPLE, { query: "i", status: "hadir", category: "all", sort: "name-asc" }))).toEqual(["Citra", "dewi Lestari"]);
  });

  it("semua pilihan urutan", () => {
    const sort = (s: Parameters<typeof filterAndSortGuests>[1]["sort"]) => names(filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, sort: s }));
    expect(sort("name-asc")).toEqual(["Andi", "Budi", "Citra", "dewi Lestari"]);
    expect(sort("name-desc")).toEqual(["dewi Lestari", "Citra", "Budi", "Andi"]);
    expect(sort("newest")).toEqual(["dewi Lestari", "Budi", "Andi", "Citra"]);
    expect(sort("pax-desc")).toEqual(["Andi", "dewi Lestari", "Citra", "Budi"]);
    expect(sort("status")).toEqual(["Andi", "Citra", "dewi Lestari", "Budi"]); // menunggu, hadir, tidak hadir
  });

  it("tidak mengubah array asli; hasActiveFilters mengabaikan urutan", () => {
    const copy = JSON.stringify(SAMPLE);
    filterAndSortGuests(SAMPLE, { ...DEFAULT_GUEST_FILTERS, sort: "name-desc" });
    expect(JSON.stringify(SAMPLE)).toBe(copy);
    expect(hasActiveFilters(DEFAULT_GUEST_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_GUEST_FILTERS, sort: "name-desc" })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_GUEST_FILTERS, query: "  " })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_GUEST_FILTERS, query: "a" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_GUEST_FILTERS, status: "hadir" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_GUEST_FILTERS, category: "Teman" })).toBe(true);
  });

  it("kelompok = bawaan + kelompok yang sudah dipakai, tanpa duplikat", () => {
    const cats = guestCategories([g("x", "X", "belum", 1, "Komunitas"), g("y", "Y", "belum", 1, "Teman")]);
    expect(cats).toContain("Komunitas");
    expect(cats.filter((c) => c === "Teman")).toHaveLength(1);
    for (const d of GUEST_CATEGORIES) expect(cats).toContain(d);
  });
});

describe("ringkasan angka", () => {
  it("dihitung dari data: undangan dan orang dipisah dengan jelas", () => {
    const s = summarizeGuests(SAMPLE);
    expect(s.total).toEqual({ invitations: 4, people: 10 });
    expect(s.hadir).toEqual({ invitations: 2, people: 5 });
    expect(s.belum).toEqual({ invitations: 1, people: 4 });
    expect(s.tidak_hadir).toEqual({ invitations: 1, people: 1 });
  });

  it("hadir + menunggu + tidak hadir selalu sama dengan total, di kedua satuan", () => {
    for (const list of [[], SAMPLE, [g("1", "A", "belum", 5)], [g("1", "A", "hadir", 1), g("2", "B", "hadir", 2)]]) {
      const s = summarizeGuests(list);
      expect(s.hadir.invitations + s.belum.invitations + s.tidak_hadir.invitations).toBe(s.total.invitations);
      expect(s.hadir.people + s.belum.people + s.tidak_hadir.people).toBe(s.total.people);
    }
  });

  it("daftar kosong menghasilkan nol, bukan NaN", () => {
    expect(summarizeGuests([]).total).toEqual({ invitations: 0, people: 0 });
  });
});

describe("tambah, ubah, hapus tamu (aksi murni)", () => {
  it("menambah tamu ke akhir daftar, mencatat aktivitas, dan memakai workspace akun", () => {
    const d = withWorkspace();
    const r = addGuest(d, raw({ name: "Rina", pax: "3" }), ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.guests).toHaveLength(1);
    expect(r.guest.workspaceId).toBe(d.workspace?.id);
    expect(r.guest.pax).toBe(3);
    expect(r.data.activityLog[0].action).toBe("menambahkan tamu");
    expect(r.data.activityLog[0].actorName).toBe("Akun Uji");
    expect(d.guests).toHaveLength(0); // data awal tidak dimutasi
  });

  it("menolak input tidak valid atau nama ganda tanpa mengubah data", () => {
    const d = withWorkspace();
    const bad = addGuest(d, raw({ name: "" }), ctx);
    expect(bad.ok).toBe(false);
    const first = addGuest(d, raw({ name: "Rina" }), ctx);
    if (!first.ok) throw new Error("harus ok");
    const dup = addGuest(first.data, raw({ name: "rina " }), ctx);
    expect(dup.ok).toBe(false);
    expect(!dup.ok && dup.error).toBe("validation");
    expect(!dup.ok && dup.errors?.name).toBeTruthy();
  });

  it("tanpa proyek pernikahan, tamu tidak bisa ditambahkan", () => {
    const r = addGuest(emptyUserData(), raw(), ctx);
    expect(r).toEqual({ ok: false, error: "no-workspace" });
  });

  it("mengubah tamu mempertahankan kolom yang tidak ada di form dan mengosongkan kolom opsional", () => {
    let d = withWorkspace();
    const added = addGuest(d, raw({ name: "Rina", phone: "081234567890", notes: "catatan" }), ctx);
    if (!added.ok) throw new Error("harus ok");
    d = { ...added.data, guests: added.data.guests.map((x) => ({ ...x, relationship: "Sepupu", table: "A1", giftStatus: "sudah" as const })) };
    const r = updateGuest(d, added.guest.id, raw({ name: "Rina Putri", pax: "5", phone: "", notes: "", rsvp: "hadir" }), ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.guest).toEqual({ id: added.guest.id, workspaceId: d.workspace?.id, name: "Rina Putri", category: "Teman", pax: 5, phone: undefined, rsvp: "hadir", notes: undefined, relationship: "Sepupu", table: "A1", giftStatus: "sudah" });
    expect(r.data.guests).toHaveLength(1);
  });

  it("ubah dengan id tidak dikenal / input tidak valid ditolak", () => {
    const d = withWorkspace();
    expect(updateGuest(d, "nope", raw(), ctx)).toEqual({ ok: false, error: "not-found" });
    const added = addGuest(d, raw({ name: "Rina" }), ctx);
    if (!added.ok) throw new Error("harus ok");
    const r = updateGuest(added.data, added.guest.id, raw({ name: "" }), ctx);
    expect(!r.ok && r.error).toBe("validation");
  });

  it("menghapus hanya tamu yang dipilih", () => {
    let d = withWorkspace();
    for (const n of ["A", "B", "C"]) {
      const r = addGuest(d, raw({ name: n }), ctx);
      if (!r.ok) throw new Error("harus ok");
      d = r.data;
    }
    const target = d.guests[1];
    const r = deleteGuest(d, target.id, ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.guests.map((x) => x.name)).toEqual(["A", "C"]);
    expect(r.data.activityLog[0].action).toBe("menghapus tamu");
    expect(deleteGuest(r.data, target.id, ctx)).toEqual({ ok: false, error: "not-found" });
  });

  it("mengubah status konfirmasi saja", () => {
    const added = addGuest(withWorkspace(), raw({ name: "Rina" }), ctx);
    if (!added.ok) throw new Error("harus ok");
    const r = setGuestRsvp(added.data, added.guest.id, "hadir", ctx);
    expect(r.ok && r.data.guests[0].rsvp).toBe("hadir");
    expect(r.ok && r.data.guests[0].name).toBe("Rina");
    expect(setGuestRsvp(added.data, "nope", "hadir", ctx)).toEqual({ ok: false, error: "not-found" });
  });
});
