/**
 * Aturan Seserahan yang murni (tanpa React): validasi, uang, filter, urutan, dan ringkasan.
 *
 * Model biaya (mengikuti data yang sudah ada, tanpa hitung ganda):
 *  - plannedBudget = perkiraan biaya TOTAL item itu (bukan harga satuan)
 *  - actualCost    = biaya sebenarnya; dihitung sebagai realisasi HANYA jika status "dibeli"
 *  - quantity      = jumlah barang (informasi; tidak mengalikan biaya)
 */

import type { SeserahanItem } from "./types";

export type SeserahanStatus = SeserahanItem["status"];

export const SESERAHAN_STATUSES: SeserahanStatus[] = ["belum", "diproses", "dibeli"];

export const SESERAHAN_STATUS_LABEL: Record<SeserahanStatus, string> = {
  belum: "Belum Dibeli",
  diproses: "Dalam Persiapan",
  dibeli: "Sudah Disiapkan",
};

export const SESERAHAN_CATEGORIES = ["Perlengkapan Ibadah", "Pakaian", "Perawatan Diri", "Makanan", "Aksesori", "Lainnya"];

export const SESERAHAN_LIMITS = { name: 100, category: 40, notes: 300, quantityMax: 999, moneyMax: 10_000_000_000 } as const;

/** Isi form apa adanya (semua teks). */
export interface RawSeserahanInput {
  name: string;
  category: string;
  quantity: string | number;
  plannedBudget: string;
  status: string;
  actualCost: string;
  purchaseDate: string;
  notes: string;
}

export interface SeserahanInput {
  name: string;
  category: string;
  quantity: number;
  plannedBudget: number;
  status: SeserahanStatus;
  actualCost: number;
  purchaseDate?: string;
  notes?: string;
}

export type SeserahanField = "name" | "category" | "quantity" | "plannedBudget" | "status" | "actualCost" | "purchaseDate" | "notes";
export type SeserahanErrors = Partial<Record<SeserahanField, string>>;

export type ItemActionError = "no-workspace" | "validation" | "not-found" | "storage";

export function itemErrorMessage(error: ItemActionError): string {
  switch (error) {
    case "no-workspace":
      return "Proyek pernikahan belum dibuat.";
    case "validation":
      return "Periksa kembali isian yang ditandai.";
    case "not-found":
      return "Item tidak ditemukan. Mungkin sudah dihapus.";
    case "storage":
      return "Gagal menyimpan: penyimpanan browser penuh atau diblokir. Data tidak diubah.";
  }
}

// ---------------------------------------------------------------- uang (rupiah bulat)

/**
 * Membaca isian rupiah: "1500000", "1.500.000", "Rp 1.500.000". Kosong = 0.
 * Menolak negatif, pecahan, dan huruf. Mengembalikan angka atau pesan galat.
 */
export function parseRupiah(text: string): { value: number } | { error: string } {
  const t = text.trim().replace(/^rp\.?\s*/i, "").trim();
  if (t === "") return { value: 0 };
  if (t.startsWith("-")) return { error: "Biaya tidak boleh negatif." };
  let digits: string | null = null;
  if (/^\d+$/.test(t)) digits = t;
  else if (/^\d{1,3}([.,]\d{3})+$/.test(t)) digits = t.replace(/[.,]/g, ""); // pemisah ribuan
  if (digits === null) return { error: "Isi angka rupiah tanpa pecahan, mis. 1500000 atau 1.500.000." };
  const value = Number(digits);
  if (value > SESERAHAN_LIMITS.moneyMax) return { error: "Nilai terlalu besar (maksimal Rp 10.000.000.000)." };
  return { value };
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00`).getTime());
}

export function validateSeserahanInput(raw: RawSeserahanInput): { errors: SeserahanErrors; value: SeserahanInput | null } {
  const errors: SeserahanErrors = {};

  const name = raw.name.trim().replace(/\s+/g, " ");
  if (!name) errors.name = "Isi nama item.";
  else if (name.length > SESERAHAN_LIMITS.name) errors.name = `Nama maksimal ${SESERAHAN_LIMITS.name} karakter.`;

  const category = raw.category.trim();
  if (!category) errors.category = "Pilih kategori.";
  else if (category.length > SESERAHAN_LIMITS.category) errors.category = `Kategori maksimal ${SESERAHAN_LIMITS.category} karakter.`;

  const qText = String(raw.quantity).trim();
  const quantity = Number(qText);
  if (!qText) errors.quantity = "Isi jumlah.";
  else if (!Number.isInteger(quantity) || quantity < 1 || quantity > SESERAHAN_LIMITS.quantityMax) {
    errors.quantity = `Jumlah harus bilangan bulat 1–${SESERAHAN_LIMITS.quantityMax}.`;
  }

  const planned = parseRupiah(raw.plannedBudget);
  if ("error" in planned) errors.plannedBudget = planned.error;

  const actual = parseRupiah(raw.actualCost);
  if ("error" in actual) errors.actualCost = actual.error;

  if (!SESERAHAN_STATUSES.includes(raw.status as SeserahanStatus)) errors.status = "Pilih status.";

  const date = raw.purchaseDate.trim();
  if (date && !isValidDate(date)) errors.purchaseDate = "Tanggal tidak valid.";

  const notes = raw.notes.trim();
  if (notes.length > SESERAHAN_LIMITS.notes) errors.notes = `Catatan maksimal ${SESERAHAN_LIMITS.notes} karakter.`;

  if (Object.keys(errors).length > 0 || "error" in planned || "error" in actual) return { errors, value: null };
  return {
    errors,
    value: {
      name,
      category,
      quantity,
      plannedBudget: planned.value,
      status: raw.status as SeserahanStatus,
      actualCost: actual.value,
      purchaseDate: date || undefined,
      notes: notes || undefined,
    },
  };
}

// ---------------------------------------------------------------- filter & urutan

export type SeserahanSort = "name-asc" | "newest" | "cost-desc" | "status";

export const SESERAHAN_SORT_LABEL: Record<SeserahanSort, string> = {
  "name-asc": "Nama (A–Z)",
  newest: "Terbaru ditambahkan",
  "cost-desc": "Estimasi biaya terbesar",
  status: "Status persiapan",
};

export interface SeserahanFilters {
  query: string;
  status: SeserahanStatus | "all";
  category: string | "all";
  sort: SeserahanSort;
}

export const DEFAULT_SESERAHAN_FILTERS: SeserahanFilters = { query: "", status: "all", category: "all", sort: "name-asc" };

export function hasActiveSeserahanFilters(f: SeserahanFilters): boolean {
  return f.query.trim() !== "" || f.status !== "all" || f.category !== "all";
}

const STATUS_ORDER: Record<SeserahanStatus, number> = { belum: 0, diproses: 1, dibeli: 2 };

export function filterAndSortSeserahan(items: SeserahanItem[], f: SeserahanFilters): SeserahanItem[] {
  const q = f.query.trim().toLowerCase();
  const kept = items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        (q === "" || item.name.toLowerCase().includes(q)) &&
        (f.status === "all" || item.status === f.status) &&
        (f.category === "all" || item.category === f.category)
    );
  const byName = (a: SeserahanItem, b: SeserahanItem) => a.name.localeCompare(b.name, "id", { sensitivity: "base" });
  kept.sort((a, b) => {
    switch (f.sort) {
      case "newest":
        return b.index - a.index; // item baru selalu ditambahkan di akhir daftar
      case "cost-desc":
        return b.item.plannedBudget - a.item.plannedBudget || byName(a.item, b.item);
      case "status":
        return STATUS_ORDER[a.item.status] - STATUS_ORDER[b.item.status] || byName(a.item, b.item);
      default:
        return byName(a.item, b.item);
    }
  });
  return kept.map((x) => x.item);
}

export function seserahanCategories(items: SeserahanItem[]): string[] {
  const set = new Set<string>(SESERAHAN_CATEGORIES);
  for (const i of items) if (i.category.trim()) set.add(i.category);
  return [...set];
}

// ---------------------------------------------------------------- ringkasan & progres

export interface SeserahanSummary {
  total: number;
  /** status "dibeli" (label: Sudah Disiapkan): satu-satunya yang dihitung selesai */
  done: number;
  /** status "diproses" (label: Dalam Persiapan) */
  inProgress: number;
  /** status "belum" (label: Belum Dibeli) */
  notBought: number;
  /** 0–100, dibulatkan; 0 jika belum ada item */
  percent: number;
  /** jumlah perkiraan biaya semua item (ESTIMASI, bukan pengeluaran) */
  estimated: number;
  /** jumlah biaya sebenarnya HANYA dari item yang sudah disiapkan (REALISASI) */
  actual: number;
}

/** Selalu berlaku: done + inProgress + notBought = total. */
export function summarizeSeserahan(items: SeserahanItem[]): SeserahanSummary {
  let done = 0;
  let inProgress = 0;
  let notBought = 0;
  let estimated = 0;
  let actual = 0;
  for (const i of items) {
    estimated += i.plannedBudget;
    if (i.status === "dibeli") {
      done += 1;
      actual += i.actualCost;
    } else if (i.status === "diproses") inProgress += 1;
    else notBought += 1;
  }
  const total = items.length;
  return { total, done, inProgress, notBought, percent: total === 0 ? 0 : Math.round((done / total) * 100), estimated, actual };
}

/** Jumlah barang untuk tampilan: item lama tanpa field quantity dianggap 1. */
export function quantityOf(item: SeserahanItem): number {
  return typeof item.quantity === "number" && item.quantity >= 1 ? item.quantity : 1;
}
