import { format } from "date-fns";
import { ArrowLeft, Clock, StickyNote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { CategoryBadge } from "@/components/measurements/CategoryBadge";
import { DeleteButton } from "@/components/measurements/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import type { Measurement } from "@/types/database";

export default async function MeasurementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("blood_pressure_records").select("*").eq("id", id).single();
  if (!data) notFound();
  const record = data as Measurement;
  let imageUrl: string | null = null;
  if (record.image_path) {
    const { data: signed } = await supabase.storage.from("bp-images").createSignedUrl(record.image_path, 3600);
    imageUrl = signed?.signedUrl ?? null;
  }
  const crisis = record.category === "HYPERTENSIVE_CRISIS";
  return <AppShell><div className="mx-auto max-w-4xl p-4 sm:p-5 md:p-8">
    <Link href="/measurements" className="page-back mb-5 inline-flex items-center gap-2 text-sm font-bold sm:mb-6"><ArrowLeft size={17}/>Quay lại lịch sử</Link>
    <div className={`card overflow-hidden ${crisis ? "border-2 border-red-600" : ""}`}>
      <div className={`p-4 sm:p-6 ${crisis ? "bg-red-700 text-white" : "bg-cyan-50"}`}><CategoryBadge category={record.category}/><h1 className="mt-3 text-xl font-black leading-7 sm:mt-4 sm:text-2xl">{crisis ? "Cảnh báo rất cao — hãy đo lại sau vài phút" : "Chi tiết lần đo"}</h1></div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">{[[record.systolic,"SYS","mmHg"],[record.diastolic,"DIA","mmHg"],[record.pulse,"PULSE","lần/phút"]].map(([value,label,unit])=><div key={label} className="min-w-0 rounded-xl bg-slate-50 px-1 py-3 sm:rounded-2xl sm:p-4"><p className="text-[10px] font-bold text-slate-400 sm:text-xs">{label}</p><b className="block truncate text-2xl sm:text-5xl">{value}</b><p className="truncate text-[9px] text-slate-400 sm:text-xs">{unit}</p></div>)}</div>
        <div className={`mt-5 rounded-2xl p-4 text-sm leading-6 sm:mt-6 sm:p-5 sm:text-base sm:leading-7 ${crisis ? "bg-red-50 text-red-900" : "bg-amber-50 text-amber-950"}`}>{record.warning_message}</div>
        <div className="mt-5 grid min-w-0 gap-5 sm:mt-6 md:grid-cols-2"><div className="min-w-0 space-y-4"><p className="flex min-w-0 gap-3"><Clock className="shrink-0 text-cyan-700"/><span className="min-w-0"><b>Thời gian đo</b><br/><span className="text-sm text-slate-500 sm:text-base">{format(new Date(record.measured_at), "dd/MM/yyyy · HH:mm")}</span></span></p><p className="flex min-w-0 gap-3"><StickyNote className="shrink-0 text-cyan-700"/><span className="min-w-0 break-words"><b>Ghi chú</b><br/><span className="text-sm text-slate-500 sm:text-base">{record.note || "Không có ghi chú"}</span></span></p></div>{imageUrl && <Image src={imageUrl} alt="Ảnh máy đo huyết áp" width={600} height={400} className="h-auto w-full rounded-2xl object-cover"/>}</div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:flex sm:flex-wrap"><DeleteButton id={record.id} path={record.image_path}/><Link href="/measurements" className="btn btn-outline">Quay lại</Link></div>
      </div>
    </div>
  </div></AppShell>;
}
