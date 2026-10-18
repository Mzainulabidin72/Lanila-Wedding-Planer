import { Badge } from "./Badge";

// Never communicate status with color alone — every badge pairs a color with
// an icon/emoji and a label, per the accessibility requirement in the brief.

const PREP_MAP = {
  belum: { tone: "neutral", icon: "○", label: "Belum" },
  diproses: { tone: "warning", icon: "◐", label: "Diproses" },
  selesai: { tone: "success", icon: "●", label: "Selesai" },
  tertunda: { tone: "danger", icon: "!", label: "Tertunda" },
} as const;

const TASK_MAP = {
  todo: { tone: "neutral", icon: "○", label: "To do" },
  in_progress: { tone: "warning", icon: "◐", label: "Dikerjakan" },
  completed: { tone: "success", icon: "●", label: "Selesai" },
  delayed: { tone: "danger", icon: "!", label: "Terlambat" },
} as const;

const VENDOR_MAP = {
  research: { tone: "neutral", icon: "○", label: "Riset" },
  contacted: { tone: "neutral", icon: "○", label: "Dihubungi" },
  negotiation: { tone: "warning", icon: "◐", label: "Negosiasi" },
  booked: { tone: "brand", icon: "◐", label: "Dipesan" },
  dp_paid: { tone: "warning", icon: "◐", label: "DP Terbayar" },
  fully_paid: { tone: "success", icon: "●", label: "Lunas" },
  cancelled: { tone: "danger", icon: "×", label: "Dibatalkan" },
} as const;

const RSVP_MAP = {
  belum: { tone: "neutral", icon: "○", label: "Belum konfirmasi" },
  hadir: { tone: "success", icon: "●", label: "Hadir" },
  tidak_hadir: { tone: "danger", icon: "×", label: "Tidak hadir" },
} as const;

function Generic({ map, value }: { map: Record<string, { tone: any; icon: string; label: string }>; value: string }) {
  const entry = map[value] ?? { tone: "neutral", icon: "○", label: value };
  return (
    <Badge tone={entry.tone}>
      <span aria-hidden>{entry.icon}</span>
      {entry.label}
    </Badge>
  );
}

export const PrepStatusBadge = ({ status }: { status: keyof typeof PREP_MAP }) => <Generic map={PREP_MAP} value={status} />;
export const TaskStatusBadge = ({ status }: { status: keyof typeof TASK_MAP }) => <Generic map={TASK_MAP} value={status} />;
export const VendorStatusBadge = ({ status }: { status: keyof typeof VENDOR_MAP }) => <Generic map={VENDOR_MAP} value={status} />;
export const RsvpBadge = ({ status }: { status: keyof typeof RSVP_MAP }) => <Generic map={RSVP_MAP} value={status} />;
