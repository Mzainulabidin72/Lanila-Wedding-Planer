import {
  ActivityLogEntry,
  BudgetItem,
  Guest,
  PreparationStage,
  SeserahanItem,
  Vendor,
  WeddingMember,
  WeddingTask,
  WeddingWorkspace,
} from "./types";

export const WORKSPACE_ID = "wk_abidin_nila";

export const workspace: WeddingWorkspace = {
  id: WORKSPACE_ID,
  name: "Abidin & Nila",
  weddingDate: "2027-02-14T08:00:00+07:00",
  weddingType: "Akad & Resepsi",
  venue: "Rumah Nila",
  targetBudget: 85_000_000,
};

export const members: WeddingMember[] = [
  { profileId: "u_nila", workspaceId: WORKSPACE_ID, role: "owner", fullName: "Nila" },
  { profileId: "u_abidin", workspaceId: WORKSPACE_ID, role: "partner", fullName: "Abidin" },
];

export const preparationStages: PreparationStage[] = [
  {
    id: "st_rtrw",
    workspaceId: WORKSPACE_ID,
    name: "RT/RW",
    order: 1,
    items: [
      { id: "i1", stageId: "st_rtrw", title: "Surat pengantar RT", status: "selesai", responsible: "Angga" },
      { id: "i2", stageId: "st_rtrw", title: "Surat pengantar RW", status: "selesai", responsible: "Angga" },
    ],
  },
  {
    id: "st_kelurahan",
    workspaceId: WORKSPACE_ID,
    name: "Kelurahan",
    order: 2,
    items: [
      { id: "i3", stageId: "st_kelurahan", title: "N1 — Surat pengantar nikah", status: "selesai", responsible: "Angga" },
      { id: "i4", stageId: "st_kelurahan", title: "N4 — Surat persetujuan mempelai", status: "diproses", responsible: "Ayu" },
    ],
  },
  {
    id: "st_puskesmas",
    workspaceId: WORKSPACE_ID,
    name: "Puskesmas",
    order: 3,
    items: [
      { id: "i5", stageId: "st_puskesmas", title: "Suntik TT calon pengantin", status: "belum", responsible: "Ayu" },
      { id: "i6", stageId: "st_puskesmas", title: "Surat keterangan sehat", status: "belum", responsible: "Ayu" },
    ],
  },
  {
    id: "st_kua",
    workspaceId: WORKSPACE_ID,
    name: "KUA",
    order: 4,
    items: [
      { id: "i7", stageId: "st_kua", title: "Pendaftaran nikah online", status: "belum", deadline: "2026-12-20", responsible: "Angga" },
      { id: "i8", stageId: "st_kua", title: "Bimbingan perkawinan", status: "belum" },
    ],
  },
  {
    id: "st_akad",
    workspaceId: WORKSPACE_ID,
    name: "Akad",
    order: 5,
    items: [{ id: "i9", stageId: "st_akad", title: "Konfirmasi penghulu & saksi", status: "belum" }],
  },
  {
    id: "st_resepsi",
    workspaceId: WORKSPACE_ID,
    name: "Resepsi",
    order: 6,
    items: [{ id: "i10", stageId: "st_resepsi", title: "Gladi resik", status: "belum" }],
  },
];

export const tasks: WeddingTask[] = [
  { id: "t1", workspaceId: WORKSPACE_ID, title: "Kirim DP dekorasi", category: "Vendor", assignee: "Ayu", deadline: "2026-10-05", priority: "high", status: "todo" },
  { id: "t2", workspaceId: WORKSPACE_ID, title: "Lengkapi N4 di kelurahan", category: "Administrasi", assignee: "Ayu", deadline: "2026-10-02", priority: "critical", status: "in_progress", linkedPreparationItemId: "i4" },
  { id: "t3", workspaceId: WORKSPACE_ID, title: "Cicipi menu catering", category: "Vendor", assignee: "Angga", deadline: "2026-10-12", priority: "medium", status: "todo" },
  { id: "t4", workspaceId: WORKSPACE_ID, title: "Booking MUA", category: "Vendor", assignee: "Ayu", deadline: "2026-09-30", priority: "high", status: "delayed" },
  { id: "t5", workspaceId: WORKSPACE_ID, title: "Cetak undangan digital", category: "Persiapan", assignee: "Angga", deadline: "2026-11-01", priority: "low", status: "todo" },
];

export const budgetItems: BudgetItem[] = [
  { id: "b1", workspaceId: WORKSPACE_ID, category: "Venue", name: "Sewa gedung", plannedAmount: 20_000_000, actualAmount: 20_000_000, paidAmount: 10_000_000, paymentStatus: "dp", deadline: "2026-12-01" },
  { id: "b2", workspaceId: WORKSPACE_ID, category: "Catering", name: "Paket 300 pax", plannedAmount: 15_000_000, actualAmount: 15_000_000, paidAmount: 5_000_000, paymentStatus: "dp", vendorId: "v2" },
  { id: "b3", workspaceId: WORKSPACE_ID, category: "Dekorasi", name: "Dekorasi pelaminan", plannedAmount: 8_000_000, actualAmount: 8_500_000, paidAmount: 8_500_000, paymentStatus: "lunas", vendorId: "v3" },
  { id: "b4", workspaceId: WORKSPACE_ID, category: "MUA", name: "Rias pengantin", plannedAmount: 6_000_000, actualAmount: 6_000_000, paidAmount: 0, paymentStatus: "belum_bayar" },
  { id: "b5", workspaceId: WORKSPACE_ID, category: "Dokumentasi", name: "Foto & video", plannedAmount: 10_000_000, actualAmount: 9_500_000, paidAmount: 3_000_000, paymentStatus: "dp" },
  { id: "b6", workspaceId: WORKSPACE_ID, category: "Busana", name: "Baju pengantin", plannedAmount: 7_000_000, actualAmount: 6_800_000, paidAmount: 6_800_000, paymentStatus: "lunas" },
  { id: "b7", workspaceId: WORKSPACE_ID, category: "Seserahan", name: "Total seserahan", plannedAmount: 5_000_000, actualAmount: 4_600_000, paidAmount: 4_600_000, paymentStatus: "lunas" },
  { id: "b8", workspaceId: WORKSPACE_ID, category: "Administrasi", name: "Biaya KUA & dokumen", plannedAmount: 1_000_000, actualAmount: 800_000, paidAmount: 800_000, paymentStatus: "lunas" },
];

export const vendors: Vendor[] = [
  { id: "v1", workspaceId: WORKSPACE_ID, name: "Graha Wonosobo", category: "Venue", contactPerson: "Pak Budi", phone: "0812xxxxxxx", price: 20_000_000, dpAmount: 10_000_000, status: "dp_paid", paymentDeadline: "2026-12-01" },
  { id: "v2", workspaceId: WORKSPACE_ID, name: "Sari Rasa Catering", category: "Catering", contactPerson: "Bu Sari", phone: "0813xxxxxxx", price: 15_000_000, dpAmount: 5_000_000, status: "dp_paid" },
  { id: "v3", workspaceId: WORKSPACE_ID, name: "Bunga Dekor", category: "Dekorasi", price: 8_500_000, dpAmount: 8_500_000, status: "fully_paid" },
  { id: "v4", workspaceId: WORKSPACE_ID, name: "Studio Kilau", category: "Dokumentasi", price: 9_500_000, dpAmount: 3_000_000, status: "dp_paid" },
  { id: "v5", workspaceId: WORKSPACE_ID, name: "MUA Kirana", category: "MUA", price: 6_000_000, dpAmount: 0, status: "negotiation", paymentDeadline: "2026-10-10" },
];

export const guests: Guest[] = [
  { id: "g1", workspaceId: WORKSPACE_ID, name: "Keluarga Pak Slamet", category: "Family", pax: 4, rsvp: "hadir" },
  { id: "g2", workspaceId: WORKSPACE_ID, name: "Rina & teman kantor", category: "Coworkers", pax: 2, rsvp: "belum" },
  { id: "g3", workspaceId: WORKSPACE_ID, name: "Keluarga Angga (Bandung)", category: "Partner's family", pax: 6, rsvp: "hadir" },
  { id: "g4", workspaceId: WORKSPACE_ID, name: "Tetangga blok C", category: "Neighbors", pax: 3, rsvp: "tidak_hadir" },
];

export const seserahanItems: SeserahanItem[] = [
  { id: "s1", workspaceId: WORKSPACE_ID, name: "Tas", category: "Fashion", plannedBudget: 1_500_000, actualCost: 1_250_000, status: "dibeli", purchaseDate: "2026-08-10" },
  { id: "s2", workspaceId: WORKSPACE_ID, name: "Sepatu", category: "Fashion", plannedBudget: 1_000_000, actualCost: 0, status: "belum" },
  { id: "s3", workspaceId: WORKSPACE_ID, name: "Perhiasan", category: "Aksesoris", plannedBudget: 2_000_000, actualCost: 2_100_000, status: "dibeli", purchaseDate: "2026-09-01" },
  { id: "s4", workspaceId: WORKSPACE_ID, name: "Perlengkapan ibadah", category: "Lainnya", plannedBudget: 500_000, actualCost: 0, status: "diproses" },
];

export const activityLog: ActivityLogEntry[] = [
  { id: "a1", workspaceId: WORKSPACE_ID, actorName: "Ayu", action: "menyelesaikan", objectLabel: "checklist dokumen N1", createdAt: "2026-09-24T09:12:00+07:00" },
  { id: "a2", workspaceId: WORKSPACE_ID, actorName: "Angga", action: "menambahkan vendor", objectLabel: "Studio Kilau (Dokumentasi)", createdAt: "2026-09-23T15:40:00+07:00" },
  { id: "a3", workspaceId: WORKSPACE_ID, actorName: "Ayu", action: "mencatat pembayaran", objectLabel: "Rp5.000.000 untuk Catering", createdAt: "2026-09-22T11:05:00+07:00" },
  { id: "a4", workspaceId: WORKSPACE_ID, actorName: "Angga", action: "menandai dibeli", objectLabel: "Seserahan — Tas", createdAt: "2026-09-20T18:30:00+07:00" },
];
