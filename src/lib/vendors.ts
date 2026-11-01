/**
 * Aturan Vendor yang murni (tanpa React): validasi, perhitungan pembayaran, filter, dan ringkasan.
 *
 * Tiga hal dipisah (tidak dicampur):
 *  - status pemesanan   = vendor.status
 *  - status kontrak     = vendor.contractStatus
 *  - pembayaran         = vendor.payments (catatan nyata; TIDAK diturunkan dari label status)
 *
 * Nilai: vendor.price adalah PENAWARAN selama status masih riset/dihubungi/negosiasi dan menjadi
 * NILAI KONTRAK setelah dipesan. Penawaran tidak pernah dihitung sebagai biaya/kontrak/pengeluaran.
 */

import { formatRupiah } from "./derive";
import { parseRupiah, type ItemActionError } from "./seserahan";
import type { ContractStatus, Vendor, VendorPayment, VendorStatus } from "./types";

export const VENDOR_STATUSES: VendorStatus[] = ["research", "contacted", "negotiation", "booked", "dp_paid", "fully_paid", "cancelled"];

export const VENDOR_STATUS_LABEL: Record<VendorStatus, string> = {
  research: "Dalam Pertimbangan",
  contacted: "Dihubungi",
  negotiation: "Negosiasi",
  booked: "Dipesan",
  dp_paid: "DP Terbayar",
  fully_paid: "Lunas",
  cancelled: "Dibatalkan",
};

/** Sudah dipesan (atau setara): menghasilkan nilai kontrak dan boleh dicatat pembayarannya. */
export const CONFIRMED_STATUSES: VendorStatus[] = ["booked", "dp_paid", "fully_paid"];
/** Masih penawaran: belum menjadi kontrak. */
export const QUOTE_STATUSES: VendorStatus[] = ["research", "contacted", "negotiation"];

export const CONTRACT_STATUSES: ContractStatus[] = ["belum", "draft", "ditandatangani"];
export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  belum: "Belum ada kontrak",
  draft: "Draft kontrak",
  ditandatangani: "Kontrak ditandatangani",
};

export const VENDOR_CATEGORIES = ["Venue", "Catering", "Dekorasi", "Fotografer", "Videografer", "Makeup Artist", "Busana", "Hiburan", "Undangan", "Transportasi", "Lainnya"];

export const VENDOR_LIMITS = { name: 100, category: 40, person: 100, email: 120, address: 200, packageDescription: 300, notes: 500, paymentNote: 100 } as const;

export type VendorActionError = ItemActionError;

export function vendorErrorMessage(error: VendorActionError): string {
  switch (error) {
    case "no-workspace":
      return "Proyek pernikahan belum dibuat.";
    case "validation":
      return "Periksa kembali isian yang ditandai.";
    case "not-found":
      return "Data vendor tidak ditemukan. Mungkin sudah dihapus.";
    case "storage":
      return "Gagal menyimpan: penyimpanan browser penuh atau diblokir. Data tidak diubah.";
  }
}

export const isConfirmed = (v: Pick<Vendor, "status">) => CONFIRMED_STATUSES.includes(v.status);
export const isQuote = (v: Pick<Vendor, "status">) => QUOTE_STATUSES.includes(v.status);
export const isArchived = (v: Vendor) => Boolean(v.archivedAt);

// ---------------------------------------------------------------- tanggal

export function localDateString(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00`).getTime()) && localDateString(new Date(`${s}T00:00:00`)) === s;
}

// ---------------------------------------------------------------- pembayaran (dari catatan nyata)

export const paymentsOf = (v: Vendor): VendorPayment[] => v.payments ?? [];
export const paidOf = (v: Vendor): number => paymentsOf(v).reduce((sum, p) => sum + p.amount, 0);
/** Sisa = nilai kontrak − pembayaran tercatat; tidak pernah negatif. */
export const remainingOf = (v: Vendor): number => Math.max(0, v.price - paidOf(v));

export type PaymentState = "quote" | "unpaid" | "partial" | "paid";

/** quote = belum dipesan, jadi belum ada kewajiban bayar. Selebihnya murni dari catatan pembayaran. */
export function paymentStateOf(v: Vendor): PaymentState {
  if (!isConfirmed(v)) return "quote";
  const paid = paidOf(v);
  if (paid <= 0) return "unpaid";
  return v.price > 0 && paid >= v.price ? "paid" : "partial";
}

export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  quote: "Belum dipesan",
  unpaid: "Belum dibayar",
  partial: "Dibayar sebagian",
  paid: "Lunas",
};

// ---------------------------------------------------------------- form vendor

export interface RawVendorInput {
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  packageDescription: string;
  price: string;
  dpAmount: string;
  paymentDeadline: string;
  status: string;
  contractStatus: string;
  notes: string;
}

export interface VendorInput {
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  packageDescription?: string;
  price: number;
  dpAmount: number;
  paymentDeadline?: string;
  status: VendorStatus;
  contractStatus: ContractStatus;
  notes?: string;
}

export type VendorField = keyof RawVendorInput;
export type VendorErrors = Partial<Record<VendorField, string>>;

export const normalizeText = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export function validateVendorInput(raw: RawVendorInput, existing: Vendor[], selfId?: string): { errors: VendorErrors; value: VendorInput | null } {
  const errors: VendorErrors = {};
  const self = selfId ? existing.find((v) => v.id === selfId) : undefined;

  const name = raw.name.trim().replace(/\s+/g, " ");
  if (!name) errors.name = "Isi nama vendor.";
  else if (name.length > VENDOR_LIMITS.name) errors.name = `Nama maksimal ${VENDOR_LIMITS.name} karakter.`;

  const category = raw.category.trim();
  if (!category) errors.category = "Pilih kategori.";
  else if (category.length > VENDOR_LIMITS.category) errors.category = `Kategori maksimal ${VENDOR_LIMITS.category} karakter.`;

  if (!errors.name && !errors.category && existing.some((v) => v.id !== selfId && normalizeText(v.name) === normalizeText(name) && normalizeText(v.category) === normalizeText(category))) {
    errors.name = "Vendor dengan nama dan kategori ini sudah ada (cek juga yang diarsipkan).";
  }

  const optional = (value: string, max: number, field: VendorField, label: string) => {
    const t = value.trim();
    if (t.length > max) errors[field] = `${label} maksimal ${max} karakter.`;
    return t || undefined;
  };
  const contactPerson = optional(raw.contactPerson, VENDOR_LIMITS.person, "contactPerson", "Nama kontak");
  const address = optional(raw.address, VENDOR_LIMITS.address, "address", "Alamat");
  const packageDescription = optional(raw.packageDescription, VENDOR_LIMITS.packageDescription, "packageDescription", "Deskripsi paket");
  const notes = optional(raw.notes, VENDOR_LIMITS.notes, "notes", "Catatan");

  const phone = raw.phone.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "").length;
    if (!/^[0-9+\-\s()]+$/.test(phone) || digits < 8 || digits > 15) errors.phone = "Nomor telepon tidak valid (8–15 digit; boleh memakai +, spasi, atau tanda hubung).";
  }

  const email = raw.email.trim();
  if (email && (email.length > VENDOR_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = "Format email belum benar.";

  const price = parseRupiah(raw.price);
  if ("error" in price) errors.price = price.error;
  const dp = parseRupiah(raw.dpAmount);
  if ("error" in dp) errors.dpAmount = dp.error;

  if (!("error" in price) && !("error" in dp)) {
    if (dp.value > 0 && price.value === 0) errors.dpAmount = "Isi nilai penawaran/kontrak lebih dulu.";
    else if (price.value > 0 && dp.value > price.value) errors.dpAmount = "DP tidak boleh melebihi nilai penawaran/kontrak.";
    const paid = self ? paidOf(self) : 0;
    if (price.value < paid) errors.price = `Nilai kontrak tidak boleh lebih kecil dari total pembayaran tercatat (${formatRupiah(paid)}).`;
  }

  const deadline = raw.paymentDeadline.trim();
  if (deadline && !isValidDate(deadline)) errors.paymentDeadline = "Tanggal tidak valid.";

  if (!VENDOR_STATUSES.includes(raw.status as VendorStatus)) errors.status = "Pilih status pemesanan.";
  else if (self && paymentsOf(self).length > 0 && QUOTE_STATUSES.includes(raw.status as VendorStatus)) {
    errors.status = "Vendor ini sudah punya pembayaran tercatat. Hapus pembayaran dulu, atau ubah status ke Dibatalkan.";
  }
  if (!CONTRACT_STATUSES.includes(raw.contractStatus as ContractStatus)) errors.contractStatus = "Pilih status kontrak.";

  if (Object.keys(errors).length > 0 || "error" in price || "error" in dp) return { errors, value: null };
  return {
    errors,
    value: {
      name,
      category,
      contactPerson,
      phone: phone || undefined,
      email: email || undefined,
      address,
      packageDescription,
      price: price.value,
      dpAmount: dp.value,
      paymentDeadline: deadline || undefined,
      status: raw.status as VendorStatus,
      contractStatus: raw.contractStatus as ContractStatus,
      notes,
    },
  };
}

// ---------------------------------------------------------------- form pembayaran

export interface RawPaymentInput {
  amount: string;
  paidAt: string;
  note: string;
}
export type PaymentField = "amount" | "paidAt" | "note" | "general";
export type PaymentErrors = Partial<Record<PaymentField, string>>;

/** today = tanggal lokal hari ini (YYYY-MM-DD), dioper agar mudah diuji. */
export function validatePaymentInput(raw: RawPaymentInput, vendor: Vendor, today: string): { errors: PaymentErrors; value: Omit<VendorPayment, "id"> | null } {
  const errors: PaymentErrors = {};

  if (isArchived(vendor)) errors.general = "Vendor ini diarsipkan. Pulihkan dulu sebelum mencatat pembayaran.";
  else if (!isConfirmed(vendor)) errors.general = "Ubah status menjadi Dipesan sebelum mencatat pembayaran. Penawaran belum menjadi biaya.";
  else if (vendor.price <= 0) errors.general = "Isi nilai kontrak vendor lebih dulu.";

  const amount = parseRupiah(raw.amount);
  if ("error" in amount) errors.amount = amount.error;
  else if (amount.value <= 0) errors.amount = "Jumlah pembayaran harus lebih dari 0.";
  else if (!errors.general && amount.value > remainingOf(vendor)) {
    errors.amount = `Melebihi sisa pembayaran (${formatRupiah(remainingOf(vendor))}). Ubah nilai kontrak dulu jika ada tambahan biaya.`;
  }

  const paidAt = raw.paidAt.trim();
  if (!paidAt) errors.paidAt = "Isi tanggal pembayaran.";
  else if (!isValidDate(paidAt)) errors.paidAt = "Tanggal tidak valid.";
  else if (paidAt > today) errors.paidAt = "Tanggal pembayaran tidak boleh di masa depan. Catat setelah benar-benar dibayar.";

  const note = raw.note.trim();
  if (note.length > VENDOR_LIMITS.paymentNote) errors.note = `Catatan maksimal ${VENDOR_LIMITS.paymentNote} karakter.`;

  if (!errors.general && !errors.amount && !errors.paidAt && !errors.note && !("error" in amount)) {
    const dup = paymentsOf(vendor).some((p) => p.amount === amount.value && p.paidAt === paidAt && normalizeText(p.note ?? "") === normalizeText(note));
    if (dup) errors.general = "Pembayaran yang sama (jumlah, tanggal, dan catatan) sudah tercatat. Satu pembayaran hanya dicatat sekali.";
  }

  if (Object.keys(errors).length > 0 || "error" in amount) return { errors, value: null };
  return { errors, value: { amount: amount.value, paidAt, note: note || undefined } };
}

// ---------------------------------------------------------------- filter & urutan

export type VendorSort = "name-asc" | "value-desc" | "due-asc" | "newest";
export const VENDOR_SORT_LABEL: Record<VendorSort, string> = {
  "name-asc": "Nama (A–Z)",
  "value-desc": "Nilai terbesar",
  "due-asc": "Jatuh tempo terdekat",
  newest: "Terbaru ditambahkan",
};

export interface VendorFilters {
  query: string;
  category: string | "all";
  /** "all" = semua yang aktif (tidak diarsipkan); "archived" = hanya yang diarsipkan */
  status: VendorStatus | "all" | "archived";
  sort: VendorSort;
}
export const DEFAULT_VENDOR_FILTERS: VendorFilters = { query: "", category: "all", status: "all", sort: "name-asc" };

export const hasActiveVendorFilters = (f: VendorFilters) => f.query.trim() !== "" || f.category !== "all" || f.status !== "all";

export function filterAndSortVendors(vendors: Vendor[], f: VendorFilters): Vendor[] {
  const q = f.query.trim().toLowerCase();
  const kept = vendors
    .map((v, index) => ({ v, index }))
    .filter(({ v }) => {
      if (f.status === "archived" ? !isArchived(v) : isArchived(v)) return false;
      if (f.status !== "all" && f.status !== "archived" && v.status !== f.status) return false;
      if (f.category !== "all" && v.category !== f.category) return false;
      return q === "" || v.name.toLowerCase().includes(q);
    });
  const byName = (a: Vendor, b: Vendor) => a.name.localeCompare(b.name, "id", { sensitivity: "base" });
  kept.sort((a, b) => {
    switch (f.sort) {
      case "value-desc":
        return b.v.price - a.v.price || byName(a.v, b.v);
      case "due-asc": {
        const da = a.v.paymentDeadline, db = b.v.paymentDeadline;
        if (da && db) return da.localeCompare(db) || byName(a.v, b.v);
        if (da) return -1;
        if (db) return 1;
        return byName(a.v, b.v);
      }
      case "newest":
        return b.index - a.index;
      default:
        return byName(a.v, b.v);
    }
  });
  return kept.map((x) => x.v);
}

export function vendorCategories(vendors: Vendor[]): string[] {
  const set = new Set<string>(VENDOR_CATEGORIES);
  for (const v of vendors) if (v.category.trim()) set.add(v.category);
  return [...set];
}

// ---------------------------------------------------------------- ringkasan

export interface VendorSummary {
  /** vendor aktif: tidak diarsipkan dan tidak dibatalkan */
  total: number;
  cancelled: number;
  archived: number;
  /** aktif dan sudah dipesan (booked / dp_paid / fully_paid) */
  booked: number;
  /** total nilai kontrak: jumlah price vendor yang SUDAH DIPESAN saja */
  contractValue: number;
  /** total penawaran yang belum menjadi kontrak (riset / dihubungi / negosiasi); BUKAN biaya */
  quoteValue: number;
  /** pembayaran tercatat untuk vendor yang sudah dipesan */
  paid: number;
  /** nilai kontrak − pembayaran tercatat, per vendor, tidak negatif */
  remaining: number;
}

export function summarizeVendors(vendors: Vendor[]): VendorSummary {
  const s: VendorSummary = { total: 0, cancelled: 0, archived: 0, booked: 0, contractValue: 0, quoteValue: 0, paid: 0, remaining: 0 };
  for (const v of vendors) {
    if (isArchived(v)) {
      s.archived += 1;
      continue;
    }
    if (v.status === "cancelled") {
      s.cancelled += 1;
      continue;
    }
    s.total += 1;
    if (isConfirmed(v)) {
      s.booked += 1;
      s.contractValue += v.price;
      s.paid += paidOf(v);
      s.remaining += remainingOf(v);
    } else {
      s.quoteValue += v.price;
    }
  }
  return s;
}

/** Tanggal tanpa jam (YYYY-MM-DD) → "12 Oktober 2026", dibaca sebagai tanggal lokal agar tidak bergeser sehari. */
export function dateLabel(date?: string): string {
  if (!date) return "-";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
}
