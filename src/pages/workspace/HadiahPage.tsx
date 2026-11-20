import { useMemo, useState } from "react";
import { Gift, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, CardBody, Modal } from "@/components/ui";
import { formatRupiah, formatDate } from "@/lib/derive";
import type { GiftRecord, GiftType } from "@/lib/types";

const TYPE_LABEL: Record<GiftType,string> = {cash:"Uang Tunai",transfer:"Transfer",physical:"Barang",other:"Lainnya"};
const emptyGift = {giftType:"cash" as GiftType,donorName:"",description:"",amount:"",itemName:"",receivedAt:new Date().toISOString().slice(0,10),thankYouStatus:"belum" as "belum"|"sudah",notes:""};

export default function HadiahPage(){
  const {gifts=[],saveGift,deleteGift,updateGiftThankYou}=useStore();
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<GiftRecord|null>(null);
  const [form,setForm]=useState(emptyGift);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState("Semua");
  const [dateFilter,setDateFilter]=useState("");
  const [sort,setSort]=useState("newest");

  const money=gifts.filter(g=>g.giftType==="cash"||g.giftType==="transfer").reduce((sum,g)=>sum+(g.amount??0),0);
  const cash=gifts.filter(g=>g.giftType==="cash").reduce((sum,g)=>sum+(g.amount??0),0);
  const transfer=gifts.filter(g=>g.giftType==="transfer").reduce((sum,g)=>sum+(g.amount??0),0);
  const physical=gifts.filter(g=>g.giftType==="physical").length;
  const donors=new Set(gifts.map(g=>g.donorName?.trim()).filter(Boolean)).size;

  const filtered=useMemo(()=>[...gifts].filter(g=>
    (!search||`${g.description} ${g.donorName??""} ${g.itemName??""}`.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter==="Semua"||g.giftType===typeFilter)&&(!dateFilter||g.receivedAt===dateFilter)
  ).sort((a,b)=>sort==="oldest"?a.receivedAt.localeCompare(b.receivedAt):b.receivedAt.localeCompare(a.receivedAt)),[gifts,search,typeFilter,dateFilter,sort]);

  function openCreate(){setEditing(null);setForm(emptyGift);setError("");setModal(true)}
  function openEdit(gift:GiftRecord){setEditing(gift);setForm({giftType:gift.giftType,donorName:gift.donorName??"",description:gift.description,amount:String(gift.amount??""),itemName:gift.itemName??"",receivedAt:gift.receivedAt,thankYouStatus:gift.thankYouStatus,notes:gift.notes??""});setError("");setModal(true)}
  function submit(){
    if(!form.description.trim())return setError(form.giftType==="physical"?"Nama atau deskripsi barang wajib diisi.":"Deskripsi hadiah wajib diisi.");
    if(!form.receivedAt)return setError("Tanggal penerimaan wajib diisi.");
    if((form.giftType==="cash"||form.giftType==="transfer")&&(Number(form.amount.replace(/[^0-9]/g,""))<0||form.amount===""))return setError("Nominal hadiah uang wajib diisi.");
    saveGift(editing?.id??null,{giftType:form.giftType,donorName:form.donorName||undefined,description:form.description,amount:(form.giftType==="cash"||form.giftType==="transfer")?Number(form.amount.replace(/[^0-9]/g,"")):undefined,itemName:form.giftType==="physical"?form.itemName||form.description:undefined,receivedAt:form.receivedAt,thankYouStatus:form.thankYouStatus,notes:form.notes||undefined});
    setModal(false);
  }

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-xl font-semibold text-ink">Hadiah Diterima</h1><p className="mt-1 text-sm text-ink-soft">Catat dan kelola hadiah yang diterima selama acara pernikahan.</p></div><Button onClick={openCreate}><Plus size={16}/> Catat Hadiah</Button></div>
    <Card><CardBody className="flex items-start gap-2"><Badge tone="brand">Privat</Badge><p className="text-sm text-ink-soft">Data hadiah hanya terlihat oleh akun kamu. Kamu bisa memilih sendiri seberapa detail informasi yang dicatat untuk setiap hadiah.</p></CardBody></Card>

    {gifts.length===0?<Card><CardBody className="flex flex-col items-center py-9 text-center"><div className="mb-3 rounded-full bg-blush-50 p-3 text-blush-600"><Gift size={26}/></div><p className="font-medium text-ink">Belum ada hadiah tercatat</p><p className="mt-1 max-w-md text-sm text-ink-soft">Catat hadiah tunai, transfer, barang, atau bentuk lainnya. Identitas pemberi bersifat opsional.</p><Button className="mt-4" onClick={openCreate}><Plus size={16}/> Catat Hadiah</Button></CardBody></Card>:<>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Total Hadiah Diterima",gifts.length.toString()],["Total Hadiah Uang",formatRupiah(money)],["Total Hadiah Barang",physical.toString()],["Jumlah Pemberi",donors.toString()]].map(([label,value])=><Card key={label}><CardBody className="p-4"><p className="text-xs text-ink-faint">{label}</p><p className="mt-2 text-base font-semibold text-ink">{value}</p></CardBody></Card>)}
      </div>
      <Card><CardBody className="p-0"><div className="flex flex-col gap-2 border-b border-surface-border p-4 md:flex-row"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-2.5 text-ink-faint"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari hadiah atau pemberi..." className="w-full rounded-md border border-surface-border py-2 pl-9 pr-3 text-sm"/></div><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="rounded-md border border-surface-border px-2 text-sm"><option>Semua</option>{Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="rounded-md border border-surface-border px-2 text-sm"/><select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-md border border-surface-border px-2 text-sm"><option value="newest">Terbaru</option><option value="oldest">Terlama</option></select></div>
        {filtered.length===0?<div className="py-8 text-center text-sm text-ink-faint">Tidak ada hadiah yang cocok dengan filter.</div>:<div className="scroll-x"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-surface-border text-left text-xs text-ink-faint"><th className="px-4 py-3">Hadiah</th><th className="py-3">Jenis</th><th className="py-3">Pemberi</th><th className="py-3">Nilai</th><th className="py-3">Tanggal</th><th className="py-3">Ucapan Terima Kasih</th><th className="px-4 py-3"></th></tr></thead><tbody>{filtered.map(gift=><tr key={gift.id} className="border-b border-surface-border last:border-0"><td className="px-4 py-3"><p className="font-medium text-ink">{gift.description}</p>{gift.notes&&<p className="text-xs text-ink-faint">{gift.notes}</p>}</td><td>{TYPE_LABEL[gift.giftType]}</td><td>{gift.donorName||"Tidak dicantumkan"}</td><td>{gift.amount!=null?formatRupiah(gift.amount):gift.giftType==="physical"?"Barang":"-"}</td><td>{formatDate(gift.receivedAt)}</td><td><select value={gift.thankYouStatus} onChange={e=>updateGiftThankYou(gift.id,e.target.value as "belum"|"sudah")} className="rounded-md border border-surface-border px-2 py-1.5 text-xs"><option value="belum">Belum Diucapkan</option><option value="sudah">Sudah Diucapkan</option></select></td><td className="px-4 text-right"><button onClick={()=>openEdit(gift)} className="mr-2 text-ink-faint" aria-label="Edit"><Pencil size={14}/></button><button onClick={()=>window.confirm("Hapus catatan hadiah ini?")&&deleteGift(gift.id)} className="text-ink-faint hover:text-danger" aria-label="Hapus"><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>}
      </CardBody></Card>
    </>}

    <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Edit Hadiah":"Catat Hadiah"} size="lg"><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block text-ink-soft">Jenis hadiah *</span><select data-autofocus value={form.giftType} onChange={e=>setForm({...form,giftType:e.target.value as GiftType})} className="w-full rounded-md border border-surface-border px-3 py-2"><option value="cash">Uang Tunai</option><option value="transfer">Transfer</option><option value="physical">Barang</option><option value="other">Lainnya</option></select></label><label className="text-sm"><span className="mb-1 block text-ink-soft">Nama pemberi (opsional)</span><input value={form.donorName} onChange={e=>setForm({...form,donorName:e.target.value})} placeholder="Dapat dikosongkan" className="w-full rounded-md border border-surface-border px-3 py-2"/></label>
      {(form.giftType==="cash"||form.giftType==="transfer")&&<><label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Nominal (Rp) *</span><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Deskripsi hadiah *</span><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Contoh: Amplop pernikahan" className="w-full rounded-md border border-surface-border px-3 py-2"/></label></>}
      {form.giftType==="physical"&&<><label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Nama barang *</span><input value={form.itemName} onChange={e=>setForm({...form,itemName:e.target.value,description:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label></>}
      {form.giftType==="other"&&<label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Deskripsi hadiah *</span><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label>}
      <label className="text-sm"><span className="mb-1 block text-ink-soft">Tanggal diterima *</span><input type="date" value={form.receivedAt} onChange={e=>setForm({...form,receivedAt:e.target.value})} className="w-full rounded-md border border-surface-border px-3 py-2"/></label><label className="text-sm"><span className="mb-1 block text-ink-soft">Status ucapan terima kasih</span><select value={form.thankYouStatus} onChange={e=>setForm({...form,thankYouStatus:e.target.value as "belum"|"sudah"})} className="w-full rounded-md border border-surface-border px-3 py-2"><option value="belum">Belum Diucapkan</option><option value="sudah">Sudah Diucapkan</option></select></label><label className="sm:col-span-2 text-sm"><span className="mb-1 block text-ink-soft">Catatan (opsional)</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="min-h-16 w-full rounded-md border border-surface-border px-3 py-2"/></label>{error&&<p className="sm:col-span-2 text-xs text-danger">{error}</p>}<div className="sm:col-span-2 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setModal(false)}>Batal</Button><Button onClick={submit}>Simpan</Button></div></div></Modal>
  </div>
}
