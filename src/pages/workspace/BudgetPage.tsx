import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useStore, useWorkspace } from "@/lib/store";
import { Button, Card, CardBody, Badge, Modal, ProgressBar } from "@/components/ui";
import { formatRupiah } from "@/lib/derive";
import type { BudgetItem } from "@/lib/types";

const CATEGORIES = ["Venue & Gedung","Catering","Dekorasi","Fotografi","Videografi","Makeup Artist","Busana Pengantin","Undangan","Souvenir","Seserahan","Cincin Pernikahan","Transportasi","Hiburan","Akad & Resepsi","Lainnya"];
const emptyBudget = { name:"", category:CATEGORIES[0], vendorId:"", plannedAmount:"", actualAmount:"", deadline:"", notes:"" };

export default function BudgetPage() {
  const workspace = useWorkspace();
  const { vendors, budgetItems, saveBudgetItem, deleteBudgetItem, addBudgetPayment, updateWorkspaceBudget } = useStore();
  const [itemModal, setItemModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [targetModal, setTargetModal] = useState(false);
  const [editing, setEditing] = useState<BudgetItem|null>(null);
  const [paying, setPaying] = useState<BudgetItem|null>(null);
  const [form, setForm] = useState(emptyBudget);
  const [target, setTarget] = useState(String(workspace.targetBudget || ""));
  const [payment, setPayment] = useState({ amount:"", paidAt:new Date().toISOString().slice(0,10), method:"", type:"dp" as "dp"|"installment"|"final", notes:"" });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [sort, setSort] = useState("due");
  const [error, setError] = useState("");

  const totalTarget = workspace.targetBudget;
  const estimated = budgetItems.reduce((sum, i) => sum + i.plannedAmount, 0);
  const actual = budgetItems.reduce((sum, i) => sum + i.actualAmount, 0);
  const paid = budgetItems.reduce((sum, i) => sum + i.paidAmount, 0);
  const outstanding = budgetItems.reduce((sum, i) => sum + Math.max(0, i.actualAmount - i.paidAmount), 0);
  const utilization = totalTarget > 0 ? Math.round((actual / totalTarget) * 100) : 0;

  const filtered = useMemo(() => {
    const rows = budgetItems.filter((item) =>
      (!search || `${item.name} ${item.notes ?? ""}`.toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === "Semua" || item.category === categoryFilter) &&
      (statusFilter === "Semua" || item.paymentStatus === statusFilter)
    );
    return [...rows].sort((a,b) => sort === "amount-desc" ? b.actualAmount-a.actualAmount : sort === "amount-asc" ? a.actualAmount-b.actualAmount : (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  }, [budgetItems,search,categoryFilter,statusFilter,sort]);

  function openCreate(){ setEditing(null); setForm(emptyBudget); setError(""); setItemModal(true); }
  function openEdit(item:BudgetItem){ setEditing(item); setForm({ name:item.name, category:item.category, vendorId:item.vendorId??"", plannedAmount:String(item.plannedAmount||""), actualAmount:String(item.actualAmount||""), deadline:item.deadline??"", notes:item.notes??"" }); setError(""); setItemModal(true); }
  function submitItem(){
    if(!form.name.trim()) return setError("Nama pengeluaran wajib diisi.");
    const planned=Number(form.plannedAmount.replace(/[^0-9]/g,""));
    const actualValue=Number(form.actualAmount.replace(/[^0-9]/g,""));
    if(!Number.isFinite(planned)||planned<0||!Number.isFinite(actualValue)||actualValue<0) return setError("Nilai anggaran tidak valid.");
    saveBudgetItem(editing?.id??null,{name:form.name,category:form.category,vendorId:form.vendorId||undefined,plannedAmount:planned,actualAmount:actualValue,deadline:form.deadline||undefined,notes:form.notes});
    setItemModal(false);
  }
  function openPayment(item:BudgetItem){ setPaying(item); setPayment({amount:"",paidAt:new Date().toISOString().slice(0,10),method:"",type:"dp",notes:""}); setError(""); setPaymentModal(true); }
  function submitPayment(){
    if(!paying)return;
    const amount=Number(payment.amount.replace(/[^0-9]/g,""));
    const remaining=paying.actualAmount-paying.paidAmount;
    if(amount<=0) return setError("Jumlah pembayaran harus lebih dari 0.");
    if(amount>remaining) return setError(`Jumlah pembayaran melebihi sisa tagihan ${formatRupiah(remaining)}.`);
    addBudgetPayment(paying.id,{amount,paidAt:payment.paidAt,method:payment.method,type:payment.type,notes:payment.notes});
    setPaymentModal(false);
  }

  const categoryRows=CATEGORIES.map((category)=>{
    const items=budgetItems.filter((i)=>i.category===category);
    if(!items.length)return null;
    const catActual=items.reduce((s,i)=>s+i.actualAmount,0), catPaid=items.reduce((s,i)=>s+i.paidAmount,0);
    return {category,estimated:items.reduce((s,i)=>s+i.plannedAmount,0),actual:catActual,paid:catPaid,outstanding:catActual-catPaid};
  }).filter(Boolean) as {category:string;estimated:number;actual:number;paid:number;outstanding:number}[];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-xl font-semibold text-ink">Budget</h1><p className="mt-1 text-sm text-ink-soft">Kelola anggaran dan pantau pengeluaran pernikahanmu.</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={()=>{setTarget(String(workspace.targetBudget||""));setTargetModal(true);}}>Atur Budget</Button><Button size="sm" onClick={openCreate}><Plus size={16}/> Tambah Anggaran</Button></div></div>

      {totalTarget===0 && budgetItems.length===0 ? (
        <Card><CardBody className="py-8 text-center"><p className="font-medium text-ink">Mulai kelola anggaran pernikahan</p><p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">Tetapkan total budget, lalu catat perkiraan biaya, pengeluaran aktual, dan pembayaran.</p><div className="mt-4 flex justify-center gap-2"><Button onClick={()=>setTargetModal(true)}>Buat Budget Pertama</Button></div></CardBody></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {[["Total Anggaran",totalTarget],["Estimasi Pengeluaran",estimated],["Pengeluaran Aktual",actual],["Sudah Dibayar",paid],["Sisa Tagihan",outstanding],["Sisa Anggaran",Math.max(0,totalTarget-actual)]].map(([label,value])=><Card key={String(label)}><CardBody className="p-4"><p className="text-xs text-ink-faint">{label}</p><p className="mt-2 text-base font-semibold text-ink">{formatRupiah(Number(value))}</p></CardBody></Card>)}
          </div>
          <Card><CardBody className="grid gap-5 p-5 md:grid-cols-2"><div><div className="flex items-center justify-between"><p className="text-sm font-medium text-ink">Pemakaian anggaran</p><p className="text-sm font-semibold text-blush-600">{utilization}%</p></div><ProgressBar className="mt-3" percent={utilization} tone={utilization>100?"danger":"brand"} label="Pemakaian anggaran"/><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><p className="text-ink-faint">Aktual: <span className="text-ink">{formatRupiah(actual)}</span></p><p className="text-right text-ink-faint">Alokasi: <span className="text-ink">{formatRupiah(totalTarget)}</span></p></div></div><div><p className="text-sm font-medium text-ink">Pembayaran</p><div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-muted"><div className="bg-success" style={{width:`${actual?Math.min(100,paid/actual*100):0}%`}}/><div className="bg-warning" style={{width:`${actual?Math.min(100,outstanding/actual*100):0}%`}}/></div><div className="mt-3 flex justify-between text-xs"><span className="text-success">Sudah dibayar {formatRupiah(paid)}</span><span className="text-warning">Sisa {formatRupiah(outstanding)}</span></div></div></CardBody></Card>

          {categoryRows.length>0&&<Card><CardBody className="grid gap-6 p-5 lg:grid-cols-2"><div><p className="mb-4 text-sm font-medium text-ink">Distribusi aktual per kategori</p>{categoryRows.map((row)=><div key={row.category} className="mb-3"><div className="mb-1 flex justify-between text-xs"><span className="text-ink-soft">{row.category}</span><span className="text-ink-faint">{formatRupiah(row.actual)}</span></div><ProgressBar percent={actual?row.actual/actual*100:0} size="sm" tone="brand"/></div>)}</div><div><p className="mb-4 text-sm font-medium text-ink">Estimasi vs aktual</p>{categoryRows.map((row)=><div key={row.category} className="mb-3"><p className="mb-1 text-xs text-ink-soft">{row.category}</p><div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-ink-faint">Estimasi</span><p className="font-medium">{formatRupiah(row.estimated)}</p></div><div><span className="text-ink-faint">Aktual</span><p className="font-medium">{formatRupiah(row.actual)}</p></div></div></div>)}</div></CardBody></Card>}

          <Card><CardBody className="p-0"><div className="flex flex-col gap-2 border-b border-surface-border p-4 md:flex-row"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-2.5 text-ink-faint"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari pengeluaran..." className="w-full rounded-md border border-surface-border py-2 pl-9 pr-3 text-sm"/></div><select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="rounded-md border border-surface-border px-2 text-sm"><option>Semua</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="rounded-md border border-surface-border px-2 text-sm"><option>Semua</option><option value="belum_bayar">Belum Dibayar</option><option value="dp">Sebagian</option><option value="lunas">Lunas</option></select><select value={sort} onChange={(e)=>setSort(e.target.value)} className="rounded-md border border-surface-border px-2 text-sm"><option value="due">Tenggat terdekat</option><option value="amount-desc">Jumlah terbesar</option><option value="amount-asc">Jumlah terkecil</option></select></div>
            {budgetItems.length===0?<div className="py-8 text-center"><p className="text-sm text-ink-soft">Belum ada pengeluaran. Tambahkan anggaran pertama untuk mulai mencatat.</p><Button className="mt-3" size="sm" onClick={openCreate}><Plus size={15}/> Tambah Anggaran</Button></div>:<div className="scroll-x"><table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b border-surface-border text-left text-xs text-ink-faint"><th className="px-4 py-3">Pengeluaran</th><th className="py-3">Estimasi</th><th className="py-3">Aktual</th><th className="py-3">Terbayar</th><th className="py-3">Sisa</th><th className="py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{filtered.map((item)=>{const remaining=Math.max(0,item.actualAmount-item.paidAmount);return <tr key={item.id} className="border-b border-surface-border last:border-0"><td className="px-4 py-3"><p className="font-medium text-ink">{item.name}</p><p className="text-xs text-ink-faint">{item.category}{item.deadline?` · ${item.deadline}`:""}</p></td><td>{formatRupiah(item.plannedAmount)}</td><td>{formatRupiah(item.actualAmount)}</td><td>{formatRupiah(item.paidAmount)}</td><td>{formatRupiah(remaining)}</td><td><Badge tone={item.paymentStatus==="lunas"?"success":item.paymentStatus==="dp"?"warning":"neutral"}>{item.paymentStatus==="lunas"?"Lunas":item.paymentStatus==="dp"?"Sebagian":"Belum Dibayar"}</Badge></td><td className="px-4 text-right"><button onClick={()=>openPayment(item)} disabled={remaining===0} className="mr-2 text-xs text-blush-600 disabled:opacity-40">Bayar</button><button onClick={()=>openEdit(item)} className="mr-2 text-ink-faint" aria-label="Edit"><Pencil size={14}/></button><button onClick={()=>window.confirm(`Hapus pengeluaran “${item.name}”?`)&&deleteBudgetItem(item.id)} className="text-ink-faint hover:text-danger" aria-label="Hapus"><Trash2 size={14}/></button></td></tr>;})}</tbody></table></div>}
          </CardBody></Card>
        </>
      )}

      <Modal open={targetModal} onClose={()=>setTargetModal(false)} title="Atur Total Budget"><label className="text-sm"><span className="mb-1 block text-ink-soft">Total anggaran (Rp)</span><input data-autofocus value={target} onChange={(e)=>setTarget(e.target.value)} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setTargetModal(false)}>Batal</Button><Button onClick={()=>{const value=Number(target.replace(/[^0-9]/g,""));if(value>=0){updateWorkspaceBudget(value);setTargetModal(false)}}}>Simpan</Button></div></Modal>
      <Modal open={itemModal} onClose={()=>setItemModal(false)} title={editing?"Edit Pengeluaran":"Tambah Pengeluaran"} size="lg"><div className="grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Nama pengeluaran *</span><input data-autofocus value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="text-sm"><span className="mb-1 block text-ink-soft">Kategori</span><select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2">{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-ink-soft">Vendor</span><select value={form.vendorId} onChange={(e)=>setForm({...form,vendorId:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"><option value="">Tidak dipilih</option>{vendors.filter(v=>!v.archivedAt).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-ink-soft">Estimasi (Rp)</span><input value={form.plannedAmount} onChange={(e)=>setForm({...form,plannedAmount:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="text-sm"><span className="mb-1 block text-ink-soft">Aktual (Rp)</span><input value={form.actualAmount} onChange={(e)=>setForm({...form,actualAmount:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Jatuh tempo</span><input type="date" value={form.deadline} onChange={(e)=>setForm({...form,deadline:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Catatan</span><textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} className="min-h-16 w-full rounded-md border border-surface-border px-3 py-2"/></label>{error&&<p className="sm:col-span-2 text-xs text-danger">{error}</p>}<div className="sm:col-span-2 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setItemModal(false)}>Batal</Button><Button onClick={submitItem}>Simpan</Button></div></div></Modal>
      <Modal open={paymentModal} onClose={()=>setPaymentModal(false)} title={`Catat Pembayaran — ${paying?.name??""}`}><div className="space-y-3"><p className="text-sm text-ink-soft">Sisa tagihan: {paying?formatRupiah(paying.actualAmount-paying.paidAmount):"-"}</p><label className="block text-sm"><span className="mb-1 block text-ink-soft">Jenis pembayaran</span><select value={payment.type} onChange={(e)=>setPayment({...payment,type:e.target.value as "dp"|"installment"|"final"})} className="w-full rounded-md border border-surface-border px-3 py-2"><option value="dp">Down Payment (DP)</option><option value="installment">Cicilan</option><option value="final">Pembayaran akhir</option></select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm"><span className="mb-1 block text-ink-soft">Jumlah (Rp)</span><input value={payment.amount} onChange={(e)=>setPayment({...payment,amount:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="text-sm"><span className="mb-1 block text-ink-soft">Tanggal</span><input type="date" value={payment.paidAt} onChange={(e)=>setPayment({...payment,paidAt:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label></div><label className="block text-sm"><span className="mb-1 block text-ink-soft">Metode</span><input value={payment.method} onChange={(e)=>setPayment({...payment,method:e.target.value})} placeholder="Transfer, tunai, kartu..." className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="block text-sm"><span className="mb-1 block text-ink-soft">Catatan</span><textarea value={payment.notes} onChange={(e)=>setPayment({...payment,notes:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label>{error&&<p className="text-xs text-danger">{error}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setPaymentModal(false)}>Batal</Button><Button onClick={submitPayment}>Simpan Pembayaran</Button></div></div></Modal>
    </div>
  );
}
