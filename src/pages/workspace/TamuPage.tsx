import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { GuestSummaryCards } from "@/components/guests/GuestSummaryCards";
import { GuestFilters } from "@/components/guests/GuestFilters";
import { GuestEmptyState, GuestList } from "@/components/guests/GuestList";
import { GuestFormModal } from "@/components/guests/GuestFormModal";
import { ConfirmDeleteDialog } from "@/components/guests/ConfirmDeleteDialog";
import {
  DEFAULT_GUEST_FILTERS,
  RSVP_LABEL,
  filterAndSortGuests,
  guestCategories,
  guestErrorMessage,
  hasActiveFilters,
  summarizeGuests,
  type GuestFilters as Filters,
} from "@/lib/guests";
import { useStore } from "@/lib/store";
import type { Guest, RsvpStatus } from "@/lib/types";

type FormState = null | { guest: Guest | null };
type Notice = null | { type: "success" | "error"; text: string };

export default function GuestsPage() {
  const { guests, addGuest, updateGuest, deleteGuest, setGuestRsvp } = useStore();
  const [filters, setFilters] = useState<Filters>(DEFAULT_GUEST_FILTERS);
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Guest | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  // Pesan sukses hilang sendiri; pesan galat tetap sampai ditutup oleh aksi berikutnya.
  useEffect(() => {
    if (notice?.type !== "success") return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const summary = useMemo(() => summarizeGuests(guests), [guests]);
  const visible = useMemo(() => filterAndSortGuests(guests, filters), [guests, filters]);
  const categories = useMemo(() => guestCategories(guests), [guests]);
  const clearFilters = () => setFilters({ ...DEFAULT_GUEST_FILTERS, sort: filters.sort });

  function handleRsvp(guest: Guest, status: RsvpStatus) {
    const result = setGuestRsvp(guest.id, status);
    setNotice(
      result.ok
        ? { type: "success", text: `Status ${guest.name} diubah menjadi ${RSVP_LABEL[status]}.` }
        : { type: "error", text: guestErrorMessage(result.error) }
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Daftar Tamu</h2>
          <p className="mt-1 text-sm text-ink-soft">Kelola tamu undangan dan pantau konfirmasi kehadiran.</p>
        </div>
        <Button onClick={() => setForm({ guest: null })}>
          <Plus size={16} aria-hidden="true" /> Tambah Tamu
        </Button>
      </header>

      {/* Wilayah pengumuman: selalu ada di DOM agar pembaca layar mengumumkan perubahannya */}
      <div role={notice?.type === "error" ? "alert" : "status"} aria-live="polite">
        {notice ? (
          <div
            className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-sm ${
              notice.type === "success" ? "bg-success-bg text-[#2F6B47]" : "bg-danger-bg text-[#962F27]"
            }`}
          >
            {notice.type === "success" ? <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" /> : <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        ) : null}
      </div>

      <GuestSummaryCards summary={summary} />

      <GuestFilters filters={filters} onChange={setFilters} categories={categories} disabled={guests.length === 0} shown={visible.length} total={guests.length} />

      {guests.length === 0 ? (
        <GuestEmptyState kind="none" onAdd={() => setForm({ guest: null })} onClearFilters={clearFilters} />
      ) : visible.length === 0 ? (
        <GuestEmptyState kind="no-match" onAdd={() => setForm({ guest: null })} onClearFilters={clearFilters} />
      ) : (
        <GuestList guests={visible} onEdit={(g) => setForm({ guest: g })} onDelete={setToDelete} onRsvpChange={handleRsvp} />
      )}

      {form ? (
        <GuestFormModal
          key={form.guest?.id ?? "baru"}
          guest={form.guest}
          existing={guests}
          onClose={() => setForm(null)}
          onSubmit={(raw) => {
            const result = form.guest ? updateGuest(form.guest.id, raw) : addGuest(raw);
            if (result.ok) {
              const hidden = hasActiveFilters(filters) && filterAndSortGuests([result.guest], filters).length === 0;
              setForm(null);
              setNotice({
                type: "success",
                text: `${form.guest ? "Perubahan disimpan" : "Tamu ditambahkan"}: ${result.guest.name}.${hidden ? " Tamu ini tidak tampil karena filter aktif." : ""}`,
              });
            }
            return result;
          }}
        />
      ) : null}

      {toDelete ? (
        <ConfirmDeleteDialog
          key={toDelete.id}
          guest={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            const result = deleteGuest(toDelete.id);
            if (result.ok) {
              setToDelete(null);
              setNotice({ type: "success", text: `Tamu dihapus: ${result.guest.name}.` });
            }
            return result;
          }}
        />
      ) : null}
    </div>
  );
}
