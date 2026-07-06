"use client";

import { format } from "date-fns";
import { Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Measurement } from "@/types/database";
import { CategoryBadge } from "./CategoryBadge";

export function MeasurementList({ initial }: { initial: Measurement[] }) {
  const [items, setItems] = useState(initial);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const shown = useMemo(() => items.filter((item) =>
    (category === "ALL" || item.category === category) && (!search || item.note?.toLowerCase().includes(search.toLowerCase())),
  ), [items, category, search]);

  async function remove(item: Measurement) {
    if (!confirm("Xóa lần đo này?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("blood_pressure_records").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    if (item.image_path) await supabase.storage.from("bp-images").remove([item.image_path]);
    setItems((current) => current.filter((value) => value.id !== item.id));
    toast.success("Đã xóa lần đo");
  }

  return <>
    <div className="card mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:p-4"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={20}/><input className="input pl-10" placeholder="Tìm theo ghi chú..." value={search} onChange={(event) => setSearch(event.target.value)}/></label><select className="input min-w-0 sm:w-64" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">Tất cả phân loại</option><option value="NORMAL">Bình thường</option><option value="ELEVATED">Hơi cao</option><option value="HYPERTENSION_STAGE_1">Tăng huyết áp mức 1</option><option value="HYPERTENSION_STAGE_2">Tăng huyết áp mức 2</option><option value="HYPERTENSIVE_CRISIS">Cảnh báo rất cao</option><option value="LOW">Huyết áp thấp</option></select></div>
    <div className="space-y-3">{shown.map((item) => <article key={item.id} className="card card-hover grid min-w-0 gap-4 p-4 sm:grid-cols-[minmax(150px,auto)_minmax(180px,1fr)_auto] sm:items-center sm:p-5">
      <div className="min-w-0"><p className="text-sm font-bold sm:text-base">{format(new Date(item.measured_at), "dd/MM/yyyy · HH:mm")}</p><CategoryBadge category={item.category}/></div>
      <div className="flex min-w-0 items-center gap-6"><div><b className="text-2xl tracking-tight">{item.systolic}/{item.diastolic}</b><p className="text-xs text-slate-400">SYS/DIA</p></div><div><b className="text-2xl">{item.pulse}</b><p className="text-xs text-slate-400">PULSE</p></div>{item.note && <p className="hidden min-w-0 flex-1 truncate text-sm text-slate-500 lg:block">{item.note}</p>}</div>
      {item.note && <p className="min-w-0 truncate text-sm text-slate-500 lg:hidden">{item.note}</p>}
      <div className="flex w-full gap-2 sm:w-auto"><Link href={`/measurements/${item.id}`} className="btn btn-outline flex-1 py-2 text-sm sm:flex-none">Chi tiết</Link><button aria-label="Xóa" className="btn shrink-0 border border-red-100 p-2 text-red-600" onClick={() => remove(item)}><Trash2 size={18}/></button></div>
    </article>)}{!shown.length && <div className="card p-8 text-center text-sm text-slate-500 sm:p-12">Không tìm thấy lần đo nào.</div>}</div>
  </>;
}
