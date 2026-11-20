import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, List, Plus, Trash2, Pencil, Clock3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, CardBody, Badge, Modal, ProgressBar } from "@/components/ui";
import { formatDate } from "@/lib/derive";
import type { WeddingTask } from "@/lib/types";

const CATEGORIES = [
  "Administrasi Pernikahan", "Venue & Lokasi", "Catering", "Dekorasi", "Busana", "Makeup",
  "Fotografi & Videografi", "Undangan", "Tamu", "Seserahan", "Akad & Resepsi", "Lainnya",
];
const STATUS: { value: WeddingTask["status"]; label: string }[] = [
  { value: "todo", label: "Belum Dimulai" }, { value: "in_progress", label: "Sedang Dikerjakan" },
  { value: "completed", label: "Selesai" }, { value: "delayed", label: "Terlambat" },
];

const emptyTask = {
  title: "", description: "", category: CATEGORIES[0], startDate: "", deadline: "",
  priority: "medium" as WeddingTask["priority"], status: "todo" as WeddingTask["status"],
  notes: "", reminderDate: "",
};

export default function TimelinePage() {
  const { tasks, saveTask, deleteTask, updateTaskStatus } = useStore();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<WeddingTask | null>(null);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    delayed: tasks.filter((t) => t.status === "delayed" || (t.status !== "completed" && !!t.deadline && t.deadline < today)).length,
  };
  const percent = tasks.length ? Math.round((counts.completed / tasks.length) * 100) : 0;
  const upcoming = [...tasks].filter((t) => t.status !== "completed" && t.deadline && t.deadline >= today).sort((a, b) => a.deadline!.localeCompare(b.deadline!)).slice(0, 3);

  const months = useMemo(() => {
    const map = new Map<string, WeddingTask[]>();
    [...tasks].sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")).forEach((task) => {
      const key = task.deadline ? task.deadline.slice(0, 7) : "Tanpa tenggat";
      map.set(key, [...(map.get(key) ?? []), task]);
    });
    return [...map.entries()];
  }, [tasks]);

  function openCreate() {
    setEditing(null);
    setForm(emptyTask);
    setError("");
    setModal(true);
  }
  function openEdit(task: WeddingTask) {
    setEditing(task);
    setForm({
      title: task.title, description: task.description ?? "", category: task.category,
      startDate: task.startDate ?? "", deadline: task.deadline ?? "",
      priority: task.priority, status: task.status, notes: task.notes ?? "", reminderDate: task.reminderDate ?? "",
    });
    setError("");
    setModal(true);
  }
  function submit() {
    if (!form.title.trim()) return setError("Judul tugas wajib diisi.");
    if (!form.category) return setError("Kategori wajib dipilih.");
    if (form.startDate && form.deadline && form.startDate > form.deadline) return setError("Tanggal mulai tidak boleh melewati tenggat.");
    saveTask(editing?.id ?? null, form);
    setModal(false);
  }

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const calendarTasks = selectedDate ? tasks.filter((task) => task.deadline === selectedDate) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-xl font-semibold text-ink">Timeline</h1><p className="mt-1 text-sm text-ink-soft">Atur seluruh persiapan pernikahan agar setiap langkah berjalan tepat waktu.</p></div>
        <Button onClick={openCreate}><Plus size={16} /> Tambah Tugas</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[["Total Tugas", tasks.length], ["Belum Dimulai", counts.todo], ["Sedang Dikerjakan", counts.in_progress], ["Selesai", counts.completed], ["Terlambat", counts.delayed]].map(([label, value]) => (
          <Card key={String(label)}><CardBody className="p-4"><p className="text-xs text-ink-faint">{label}</p><p className="mt-1 text-2xl font-semibold text-ink">{value}</p></CardBody></Card>
        ))}
      </div>

      {tasks.length > 0 && (
        <Card><CardBody className="grid gap-4 p-5 md:grid-cols-[1fr_280px]">
          <div><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-ink">Kemajuan Persiapan</p><p className="mt-1 text-xs text-ink-faint">{counts.completed} dari {tasks.length} tugas selesai</p></div><p className="text-xl font-semibold text-blush-600">{percent}%</p></div><ProgressBar className="mt-3" percent={percent} tone="brand" /></div>
          <div className="border-t border-surface-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0"><p className="text-xs font-medium text-ink-faint">Tenggat terdekat</p>{upcoming.length ? upcoming.map((task) => <p key={task.id} className="mt-2 text-xs text-ink-soft">{formatDate(task.deadline)} · {task.title}</p>) : <p className="mt-2 text-xs text-ink-faint">Tidak ada tenggat mendatang.</p>}</div>
        </CardBody></Card>
      )}

      {tasks.length === 0 ? (
        <Card><CardBody className="flex flex-col items-center py-10 text-center"><div className="mb-3 rounded-full bg-blush-50 p-3 text-blush-600"><CalendarDays size={26} /></div><p className="font-medium text-ink">Mulai susun timeline persiapanmu</p><p className="mt-1 max-w-sm text-sm text-ink-soft">Catat tugas, tenggat, dan prioritas agar persiapan tetap teratur.</p><Button className="mt-4" onClick={openCreate}><Plus size={16} /> Tambah Tugas</Button></CardBody></Card>
      ) : (
        <Card><CardBody className="p-0">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <div className="flex rounded-md bg-surface-muted p-1"><button onClick={() => setView("list")} className={`rounded px-3 py-1 text-xs ${view === "list" ? "bg-white text-ink shadow-sm" : "text-ink-faint"}`}><List size={13} className="mr-1 inline" />Daftar</button><button onClick={() => setView("calendar")} className={`rounded px-3 py-1 text-xs ${view === "calendar" ? "bg-white text-ink shadow-sm" : "text-ink-faint"}`}><CalendarDays size={13} className="mr-1 inline" />Kalender</button></div>
          </div>
          {view === "list" ? (
            <div className="divide-y divide-surface-border">{months.map(([monthKey, items]) => <div key={monthKey} className="p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">{monthKey === "Tanpa tenggat" ? monthKey : new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(`${monthKey}-01`))}</p><div className="space-y-2">{items.map((task) => <div key={task.id} className="flex flex-col gap-3 rounded-md border border-surface-border p-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium text-ink">{task.title}</p>{task.status !== "completed" && task.deadline && task.deadline < today && <Badge tone="danger">Terlambat</Badge>}</div><p className="mt-1 text-xs text-ink-faint">{task.category}{task.deadline ? ` · Tenggat ${formatDate(task.deadline)}` : ""}</p></div><Badge tone={task.priority === "high" ? "warning" : task.priority === "critical" ? "danger" : "neutral"}>{task.priority === "low" ? "Low" : task.priority === "medium" ? "Medium" : "High"}</Badge><select aria-label={`Status ${task.title}`} value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value as WeddingTask["status"])} className="rounded-md border border-surface-border px-2 py-1.5 text-xs">{STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select><button onClick={() => openEdit(task)} className="p-1.5 text-ink-faint hover:text-brand" aria-label={`Edit ${task.title}`}><Pencil size={15} /></button><button onClick={() => window.confirm(`Hapus tugas “${task.title}”?`) && deleteTask(task.id)} className="p-1.5 text-ink-faint hover:text-danger" aria-label={`Hapus ${task.title}`}><Trash2 size={15} /></button></div>)}</div></div>)}</div>
          ) : (
            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_260px]"><div><div className="mb-3 flex items-center justify-between"><button className="text-sm" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}>‹</button><p className="font-medium text-ink">{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(month)}</p><button className="text-sm" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}>›</button></div><div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-surface-border bg-surface-border">{["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => <div key={d} className="bg-surface-muted py-1 text-center text-[10px] text-ink-faint">{d}</div>)}{Array.from({ length: first }).map((_, i) => <div key={`e${i}`} className="min-h-16 bg-white" />)}{Array.from({ length: daysInMonth }).map((_, i) => {const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`; const count = tasks.filter((t) => t.deadline === date).length; return <button key={date} onClick={() => setSelectedDate(date)} className={`min-h-16 bg-white p-1 text-left text-xs ${selectedDate === date ? "ring-2 ring-inset ring-brand" : ""}`}><span>{i + 1}</span>{count > 0 && <span className="mt-2 block truncate rounded bg-blush-50 px-1 py-0.5 text-[10px] text-blush-600">{count} tugas</span>}</button>;})}</div></div><div className="rounded-md border border-surface-border p-3"><p className="text-sm font-medium text-ink">{selectedDate ? formatDate(selectedDate) : "Pilih tanggal"}</p>{calendarTasks.length ? calendarTasks.map((task) => <div key={task.id} className="mt-3 border-t border-surface-border pt-3"><p className="text-sm text-ink">{task.title}</p><p className="text-xs text-ink-faint">{task.category}</p></div>) : <p className="mt-3 text-xs text-ink-faint">Tidak ada tugas pada tanggal ini.</p>}</div></div>
          )}
        </CardBody></Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Tugas" : "Tambah Tugas"} size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Judul tugas *</span><input data-autofocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-surface-border px-3 py-2" /></label>
          <label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Deskripsi</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-20 w-full rounded-md border border-surface-border px-3 py-2" /></label>
          <label className="text-sm"><span className="mb-1 block text-ink-soft">Kategori</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-surface-border px-3 py-2">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm"><span className="mb-1 block text-ink-soft">Prioritas</span><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as WeddingTask["priority"] })} className="w-full rounded-md border border-surface-border px-3 py-2"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label className="text-sm"><span className="mb-1 block text-ink-soft">Tanggal mulai</span><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-md border border-surface-border px-3 py-2" /></label>
          <label className="text-sm"><span className="mb-1 block text-ink-soft">Tenggat</span><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-md border border-surface-border px-3 py-2" /></label>
          <label className="text-sm"><span className="mb-1 block text-ink-soft">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as WeddingTask["status"] })} className="w-full rounded-md border border-surface-border px-3 py-2">{STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          <label className="text-sm"><span className="mb-1 block text-ink-soft">Pengingat</span><input type="date" value={form.reminderDate} onChange={(e) => setForm({ ...form, reminderDate: e.target.value })} className="w-full rounded-md border border-surface-border px-3 py-2" /></label>
          <label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Catatan</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-16 w-full rounded-md border border-surface-border px-3 py-2" /></label>
          {error && <p className="sm:col-span-2 text-xs text-danger">{error}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1"><Button variant="secondary" onClick={() => setModal(false)}>Batal</Button><Button onClick={submit}>{editing ? "Simpan Perubahan" : "Tambah Tugas"}</Button></div>
        </div>
      </Modal>
    </div>
  );
}
