"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody, EmptyState, Button } from "@/components/ui";
import { RsvpBadge } from "@/components/ui/StatusBadge";
import { guestTotals } from "@/lib/derive";
import { Guest } from "@/lib/types";
import { Plus } from "lucide-react";

export default function GuestsPage() {
  const { guests, updateGuestRsvp } = useStore();
  const totals = guestTotals(guests);

  if (guests.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="Belum ada tamu ditambahkan."
        description="Mulai susun daftar tamu untuk melacak konfirmasi kehadiran."
        actionLabel="+ Tambah Tamu"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Tamu", value: totals.total },
          { label: "Terkonfirmasi", value: totals.confirmed },
          { label: "Belum Konfirmasi", value: totals.pending },
          { label: "Tidak Hadir", value: totals.declined },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-xs text-ink-faint">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-ink">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <div className="mb-3 flex justify-end">
            <Button size="sm">
              <Plus size={15} /> Tambah Tamu
            </Button>
          </div>
          <div className="scroll-x">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-faint">
                  <th className="py-2 font-medium">Nama</th>
                  <th className="py-2 font-medium">Kategori</th>
                  <th className="py-2 font-medium">Pax</th>
                  <th className="py-2 font-medium">RSVP</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.id} className="border-b border-surface-border last:border-0">
                    <td className="py-2.5 text-ink">{g.name}</td>
                    <td className="py-2.5 text-ink-soft">{g.category}</td>
                    <td className="py-2.5 text-ink-soft">{g.pax}</td>
                    <td className="py-2.5">
                      <select
                        value={g.rsvp}
                        onChange={(e) => updateGuestRsvp(g.id, e.target.value as Guest["rsvp"])}
                        className="rounded-md border border-surface-border bg-transparent px-1 py-0.5 text-xs"
                      >
                        <option value="belum">Belum konfirmasi</option>
                        <option value="hadir">Hadir</option>
                        <option value="tidak_hadir">Tidak hadir</option>
                      </select>
                      <span className="ml-2 hidden sm:inline">
                        <RsvpBadge status={g.rsvp} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
