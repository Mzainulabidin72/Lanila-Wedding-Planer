export interface AlurStep {
  title: string;
  objective: string;
  documents: string[];
  checklist: string[];
  estimatedProcess: string;
  responsible: string;
  notes?: string;
}

export const alurLakiLaki: AlurStep[] = [
  {
    title: "RT/RW",
    objective: "Mendapatkan surat pengantar untuk mengurus dokumen di kelurahan.",
    documents: ["Fotokopi KTP", "Fotokopi KK"],
    checklist: ["Minta surat pengantar RT", "Minta surat pengantar RW"],
    estimatedProcess: "1 hari",
    responsible: "Calon pengantin laki-laki",
  },
  {
    title: "Kelurahan",
    objective: "Menerbitkan surat pengantar nikah (N1) dan dokumen pendukung lain.",
    documents: ["Surat pengantar RT/RW", "Fotokopi KTP & KK", "Pas foto"],
    checklist: ["Ajukan permohonan N1", "Ambil surat setelah selesai diproses"],
    estimatedProcess: "1–3 hari kerja",
    responsible: "Calon pengantin laki-laki",
  },
  {
    title: "KUA",
    objective: "Mendaftarkan rencana pernikahan dan melengkapi persyaratan administratif.",
    documents: ["N1 dari kelurahan", "Dokumen dari pihak perempuan", "Surat keterangan sehat"],
    checklist: ["Daftar nikah (online/offline sesuai KUA setempat)", "Ikuti jadwal bimbingan perkawinan jika diwajibkan"],
    estimatedProcess: "Bervariasi tergantung KUA",
    responsible: "Kedua calon pengantin",
    notes: "Persyaratan dapat berbeda di tiap KUA — selalu konfirmasi langsung ke KUA setempat.",
  },
  {
    title: "Kirim dokumen ke pihak perempuan",
    objective: "Melengkapi berkas gabungan yang dibutuhkan pihak perempuan untuk proses di KUA.",
    documents: ["Salinan seluruh dokumen dari kelurahan & KUA"],
    checklist: ["Koordinasikan dokumen dengan calon pengantin perempuan"],
    estimatedProcess: "1 hari",
    responsible: "Calon pengantin laki-laki",
  },
];

export const alurPerempuan: AlurStep[] = [
  {
    title: "RT/RW",
    objective: "Mendapatkan surat pengantar untuk mengurus dokumen di kelurahan.",
    documents: ["Fotokopi KTP", "Fotokopi KK"],
    checklist: ["Minta surat pengantar RT", "Minta surat pengantar RW"],
    estimatedProcess: "1 hari",
    responsible: "Calon pengantin perempuan",
  },
  {
    title: "Puskesmas",
    objective: "Melengkapi pemeriksaan kesehatan pra-nikah yang umumnya diminta KUA.",
    documents: ["KTP", "Kartu imunisasi (jika ada)"],
    checklist: ["Suntik TT (tetanus toksoid)", "Ambil surat keterangan sehat"],
    estimatedProcess: "1 hari",
    responsible: "Calon pengantin perempuan",
    notes: "Kebijakan imunisasi pra-nikah dapat berbeda di tiap daerah — konfirmasi ke puskesmas setempat.",
  },
  {
    title: "KUA",
    objective: "Melengkapi dokumen (N4, dsb.) dan menyelesaikan proses pendaftaran bersama pasangan.",
    documents: ["N4 dari kelurahan", "Surat keterangan sehat", "Dokumen dari pihak laki-laki"],
    checklist: ["Lengkapi N4 di kelurahan", "Gabungkan dengan dokumen calon pengantin laki-laki"],
    estimatedProcess: "Bervariasi tergantung KUA",
    responsible: "Kedua calon pengantin",
  },
  {
    title: "Persiapan pernikahan",
    objective: "Mulai koordinasi vendor, budget, dan susunan acara setelah administrasi berjalan.",
    documents: [],
    checklist: ["Diskusikan konsep pernikahan bersama pasangan", "Mulai riset vendor prioritas"],
    estimatedProcess: "Berkelanjutan",
    responsible: "Kedua calon pengantin",
  },
];
