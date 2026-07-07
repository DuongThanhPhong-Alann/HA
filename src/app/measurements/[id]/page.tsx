import { Activity, ArrowLeft, Clock, Gauge, HeartPulse, ShieldCheck, StickyNote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { CategoryBadge } from "@/components/measurements/CategoryBadge";
import { DeleteButton } from "@/components/measurements/DeleteButton";
import { formatVietnamDateTime } from "@/lib/date-time";
import { medicalMessagesEnglish } from "@/lib/blood-pressure";
import { text } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import type { Measurement } from "@/types/database";

export default async function MeasurementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
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
  const meanArterialPressure = Math.round((record.systolic + 2 * record.diastolic) / 3);
  const pulsePressure = record.systolic - record.diastolic;
  return <AppShell><div className="mx-auto max-w-4xl p-4 sm:p-5 md:p-8">
    <Link href="/measurements" className="page-back mb-5 inline-flex items-center gap-2 text-sm font-bold sm:mb-6"><ArrowLeft size={17}/>{text(locale,"Quay lại lịch sử","Back to history")}</Link>
    <div className={`card measurement-detail-monitor overflow-hidden ${crisis ? "measurement-detail-monitor--crisis border-2 border-red-600" : ""}`}>
      <div className={`measurement-detail-head p-4 sm:p-6 ${crisis ? "bg-red-700 text-white" : ""}`}><div className="relative z-10 flex flex-wrap items-start justify-between gap-3"><div><CategoryBadge category={record.category} locale={locale}/><h1 className="mt-3 text-xl font-black leading-7 sm:mt-4 sm:text-2xl">{crisis ? text(locale,"Cảnh báo rất cao — hãy đo lại sau vài phút","Hypertensive crisis range — repeat the measurement after several minutes") : text(locale,"Chi tiết lần đo","Reading details")}</h1></div><span className="detail-verified"><ShieldCheck size={16}/>{text(locale,"Đã phân tích","Analyzed")}</span></div><div className="detail-head-ecg" aria-hidden="true"><HeartPulse/><svg viewBox="0 0 460 42" preserveAspectRatio="none"><path d="M0 23 H100 L110 23 L118 14 L127 32 L139 3 L152 36 L163 23 H280 L290 23 L298 14 L307 32 L319 3 L332 36 L343 23 H460"/></svg></div></div>
      <div className="p-4 sm:p-6">
        <div className="detail-vital-grid">{[[record.systolic,"SYS",text(locale,"Tâm thu","Systolic"),"mmHg"],[record.diastolic,"DIA",text(locale,"Tâm trương","Diastolic"),"mmHg"],[record.pulse,"PULSE",text(locale,"Nhịp tim","Pulse rate"),text(locale,"lần/phút","beats/min")]].map(([value,label,name,unit],index)=><div key={label} className={`detail-vital detail-vital--${index+1}`}><span>{label}</span><b>{value}</b><small>{name} · {unit}</small><i/></div>)}</div>
        <div className="detail-derived-grid"><div><Gauge/><span>{text(locale,"MAP ước tính","Estimated MAP")}</span><b>{meanArterialPressure} <small>mmHg</small></b></div><div><Activity/><span>{text(locale,"Hiệu áp","Pulse pressure")}</span><b>{pulsePressure} <small>mmHg</small></b></div><div><HeartPulse/><span>{text(locale,"Nhịp tim","Pulse rate")}</span><b>{record.pulse} <small>{text(locale,"lần/phút","beats/min")}</small></b></div></div>
        <div className={`detail-assessment mt-5 rounded-2xl p-4 text-sm leading-6 sm:mt-6 sm:p-5 sm:text-base sm:leading-7 ${crisis ? "detail-assessment--crisis bg-red-50 text-red-900" : "bg-amber-50 text-amber-950"}`}><span className="detail-assessment__icon"><ShieldCheck/></span><p>{locale==="en"?medicalMessagesEnglish[record.category]:record.warning_message}</p></div>
        <div className="detail-info-panel mt-5 grid min-w-0 gap-5 sm:mt-6 md:grid-cols-2"><div className="min-w-0 space-y-4"><p className="flex min-w-0 gap-3"><span className="detail-info-icon"><Clock/></span><span className="min-w-0"><b>{text(locale,"Thời gian đo","Measurement time")}</b><br/><span className="text-sm text-slate-500 sm:text-base">{formatVietnamDateTime(record.measured_at)}</span></span></p><p className="flex min-w-0 gap-3"><span className="detail-info-icon"><StickyNote/></span><span className="min-w-0 break-words"><b>{text(locale,"Ghi chú","Clinical note")}</b><br/><span className="text-sm text-slate-500 sm:text-base">{record.note || text(locale,"Không có ghi chú","No clinical note")}</span></span></p></div>{imageUrl && <Image src={imageUrl} alt={text(locale,"Ảnh máy đo huyết áp","Blood pressure monitor image")} width={600} height={400} className="detail-monitor-image h-auto w-full rounded-2xl object-cover"/>}</div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:flex sm:flex-wrap"><DeleteButton id={record.id} path={record.image_path} locale={locale}/><Link href="/measurements" className="btn btn-outline">{text(locale,"Quay lại","Back")}</Link></div>
      </div>
    </div>
  </div></AppShell>;
}
