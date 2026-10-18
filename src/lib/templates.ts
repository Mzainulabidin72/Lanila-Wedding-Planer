import type { PreparationStage } from "./types";

/**
 * Daftar persiapan awal yang NETRAL untuk setiap proyek baru: hanya judul langkah
 * umum, semua berstatus "belum". Tidak berisi nama orang, tanggal, atau angka apa pun.
 */
export function buildStarterStages(workspaceId: string): PreparationStage[] {
  const stage = (
    id: string,
    name: string,
    order: number,
    items: { id: string; title: string }[]
  ): PreparationStage => ({
    id,
    workspaceId,
    name,
    order,
    items: items.map((it) => ({ id: it.id, stageId: id, title: it.title, status: "belum" as const })),
  });

  return [
    stage("st_rtrw", "RT/RW", 1, [
      { id: "i1", title: "Surat pengantar RT" },
      { id: "i2", title: "Surat pengantar RW" },
    ]),
    stage("st_kelurahan", "Kelurahan", 2, [
      { id: "i3", title: "N1 — Surat pengantar nikah" },
      { id: "i4", title: "N4 — Surat persetujuan mempelai" },
    ]),
    stage("st_puskesmas", "Puskesmas", 3, [
      { id: "i5", title: "Suntik TT calon pengantin" },
      { id: "i6", title: "Surat keterangan sehat" },
    ]),
    stage("st_kua", "KUA", 4, [
      { id: "i7", title: "Pendaftaran nikah online" },
      { id: "i8", title: "Bimbingan perkawinan" },
    ]),
    stage("st_akad", "Akad", 5, [{ id: "i9", title: "Konfirmasi penghulu & saksi" }]),
    stage("st_resepsi", "Resepsi", 6, [{ id: "i10", title: "Gladi resik" }]),
  ];
}
