/**
 * Aturan Daftar Tamu yang murni (tanpa React): validasi, filter, urutan, dan ringkasan.
 * Dipakai oleh form (pesan inline), aksi data (pertahanan terakhir), dan halaman.
 */

import type { Guest, RsvpStatus } from "./types";

export const RSVP_STATUSES: RsvpStatus[] = ["belum", "hadir", "tidak_hadir"];

/** Label tunggal untuk seluruh UI Daftar Tamu agar konsisten. */
export const RSVP_LABEL: Record<RsvpStatus, string> = {
  belum: "Menunggu Konfirmasi",
  hadir: "Hadir",
  tidak_hadir: "Tidak Hadir",
};

export const GUEST_CATEGORIES = ["Keluarga", "Teman", "Rekan Kerja", "Tetangga", "Lainnya"];

export const GUEST_LIMITS = { name: 100, category: 40, notes: 300, paxMax: 50 } as const;

/** Isi form apa adanya (semua teks); divalidasi lalu dibersihkan oleh validateGuestInput. */
export interface RawGuestInput {
  name: string;
  category: string;
  pax: string | number;
  phone: string;
  rsvp: string;
  notes: string;
}

/** Data tamu yang sudah bersih dan valid. */
export interface GuestInput {
  name: string;
  category: string;
  pax: number;
  phone?: string;
  rsvp: RsvpStatus;
  notes?: string;
}

export type GuestField = "name" | "category" | "pax" | "phone" | "rsvp" | "notes";
export type GuestErrors = Partial<Record<GuestField, string>>;

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function validateGuestInput(
  raw: RawGuestInput,
  existing: Guest[],
  selfId?: string
): { errors: GuestErrors; value: GuestInput | null } {
  const errors: GuestErrors = {};

  const name = raw.name.trim().replace(/\s+/g, " ");
  if (!name) errors.name = "Isi nama tamu.";
  else if (name.length > GUEST_LIMITS.name) errors.name = `Nama maksimal ${GUEST_LIMITS.name} karakter.`;
  else if (existing.some((g) => g.id !== selfId && normalizeName(g.name) === normalizeName(name))) {
    errors.name = "Nama ini sudah ada di daftar. Tambahkan nama belakang atau keterangan agar berbeda.";
  }

  const category = raw.category.trim();
  if (!category) errors.category = "Pilih kelompok tamu.";
  else if (category.length > GUEST_LIMITS.category) errors.category = `Kelompok maksimal ${GUEST_LIMITS.category} karakter.`;

  const paxText = String(raw.pax).trim();
  const pax = Number(paxText);
  if (!paxText) errors.pax = "Isi jumlah orang.";
  else if (!Number.isInteger(pax) || pax < 1 || pax > GUEST_LIMITS.paxMax) {
    errors.pax = `Jumlah orang harus bilangan bulat 1–${GUEST_LIMITS.paxMax}.`;
  }

  const phone = raw.phone.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "").length;
    if (!/^[0-9+\-\s()]+$/.test(phone) || digits < 8 || digits > 15) {
      errors.phone = "Nomor telepon tidak valid (8–15 digit; boleh memakai +, spasi, atau tanda hubung).";
    }
  }

  if (!RSVP_STATUSES.includes(raw.rsvp as RsvpStatus)) errors.rsvp = "Pilih status konfirmasi.";

  const notes = raw.notes.trim();
  if (notes.length > GUEST_LIMITS.notes) errors.notes = `Catatan maksimal ${GUEST_LIMITS.notes} karakter.`;

  if (Object.keys(errors).length > 0) return { errors, value: null };
  return {
    errors,
    value: {
      name,
      category,
      pax,
      phone: phone || undefined,
      rsvp: raw.rsvp as RsvpStatus,
      notes: notes || undefined,
    },
  };
}

// ---------------------------------------------------------------- filter & urutan

export type GuestSort = "name-asc" | "name-desc" | "newest" | "pax-desc" | "status";

export const GUEST_SORT_LABEL: Record<GuestSort, string> = {
  "name-asc": "Nama (A–Z)",
  "name-desc": "Nama (Z–A)",
  newest: "Terbaru ditambahkan",
  "pax-desc": "Jumlah orang terbanyak",
  status: "Status konfirmasi",
};

export interface GuestFilters {
  query: string;
  status: RsvpStatus | "all";
  category: string | "all";
  sort: GuestSort;
}

export const DEFAULT_GUEST_FILTERS: GuestFilters = { query: "", status: "all", category: "all", sort: "name-asc" };

/** Pencarian/filter yang sedang aktif (urutan bukan filter). */
export function hasActiveFilters(f: GuestFilters): boolean {
  return f.query.trim() !== "" || f.status !== "all" || f.category !== "all";
}

const STATUS_ORDER: Record<RsvpStatus, number> = { belum: 0, hadir: 1, tidak_hadir: 2 };

export function filterAndSortGuests(guests: Guest[], f: GuestFilters): Guest[] {
  const q = f.query.trim().toLowerCase();
  const indexed = guests.map((g, index) => ({ g, index }));
  const kept = indexed.filter(
    ({ g }) =>
      (q === "" || g.name.toLowerCase().includes(q)) &&
      (f.status === "all" || g.rsvp === f.status) &&
      (f.category === "all" || g.category === f.category)
  );
  const byName = (a: Guest, b: Guest) => a.name.localeCompare(b.name, "id", { sensitivity: "base" });
  kept.sort((a, b) => {
    switch (f.sort) {
      case "name-desc":
        return byName(b.g, a.g);
      case "newest":
        return b.index - a.index; // tamu baru selalu ditambahkan di akhir daftar
      case "pax-desc":
        return b.g.pax - a.g.pax || byName(a.g, b.g);
      case "status":
        return STATUS_ORDER[a.g.rsvp] - STATUS_ORDER[b.g.rsvp] || byName(a.g, b.g);
      default:
        return byName(a.g, b.g);
    }
  });
  return kept.map((x) => x.g);
}

/** Kelompok yang tersedia untuk filter/form: bawaan + yang sudah dipakai tamu. */
export function guestCategories(guests: Guest[]): string[] {
  const set = new Set<string>(GUEST_CATEGORIES);
  for (const g of guests) if (g.category.trim()) set.add(g.category);
  return [...set];
}

// ---------------------------------------------------------------- ringkasan

export interface Tally {
  /** jumlah undangan (baris tamu) */
  invitations: number;
  /** jumlah orang (total pax) */
  people: number;
}

export interface GuestSummary {
  total: Tally;
  hadir: Tally;
  belum: Tally;
  tidak_hadir: Tally;
}

/**
 * Ringkasan dalam DUA satuan yang dipisah jelas: undangan (baris) dan orang (pax).
 * Selalu berlaku: hadir + belum + tidak_hadir = total, di kedua satuan.
 */
export function summarizeGuests(guests: Guest[]): GuestSummary {
  const empty = (): Tally => ({ invitations: 0, people: 0 });
  const s: GuestSummary = { total: empty(), hadir: empty(), belum: empty(), tidak_hadir: empty() };
  for (const g of guests) {
    for (const t of [s.total, s[g.rsvp]]) {
      t.invitations += 1;
      t.people += g.pax;
    }
  }
  return s;
}

// ---------------------------------------------------------------- hasil operasi & pesan

export type GuestActionError = "no-workspace" | "validation" | "not-found" | "storage";

/** Pesan untuk pengguna; "storage" berarti data TIDAK berubah karena gagal disimpan. */
export function guestErrorMessage(error: GuestActionError): string {
  switch (error) {
    case "no-workspace":
      return "Proyek pernikahan belum dibuat.";
    case "validation":
      return "Periksa kembali isian yang ditandai.";
    case "not-found":
      return "Data tamu tidak ditemukan. Mungkin sudah dihapus.";
    case "storage":
      return "Gagal menyimpan: penyimpanan browser penuh atau diblokir. Data tidak diubah.";
  }
}
