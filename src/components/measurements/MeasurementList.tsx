"use client";

import { Activity, CalendarDays, ChevronRight, Gauge, HeartPulse, Search, Stethoscope, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { formatVietnamDateTime } from "@/lib/date-time";
import type { Measurement } from "@/types/database";
import { text, type AppLocale } from "@/lib/i18n";
import { CategoryBadge } from "./CategoryBadge";

const severityStyles = {
  info: "history-card--info",
  success: "history-card--success",
  warning: "history-card--warning",
  danger: "history-card--danger",
  emergency: "history-card--emergency",
} as const;

export function MeasurementList({ initial, locale = "vi" }: { initial: Measurement[]; locale?: AppLocale }) {
  const [items, setItems] = useState(initial);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const shown = useMemo(() => items.filter((item) =>
    (category === "ALL" || item.category === category) && (!search || item.note?.toLowerCase().includes(search.toLowerCase())),
  ), [items, category, search]);

  async function remove(item: Measurement) {
    if (!confirm(text(locale,"Xóa lần đo này?","Delete this reading?"))) return;
    const supabase = createClient();
    const { error } = await supabase.from("blood_pressure_records").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    if (item.image_path) await supabase.storage.from("bp-images").remove([item.image_path]);
    setItems((current) => current.filter((value) => value.id !== item.id));
    toast.success(text(locale,"Đã xóa lần đo","Reading deleted"));
  }

  return <>
    <div className="card mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:p-4">
      <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={20}/><input className="input pl-10" placeholder={text(locale,"Tìm theo ghi chú...","Search clinical notes...")} value={search} onChange={(event) => setSearch(event.target.value)}/></label>
      <select aria-label={text(locale,"Lọc theo phân loại","Filter by classification")} className="input min-w-0 sm:w-64" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">{text(locale,"Tất cả phân loại","All classifications")}</option><option value="NORMAL">{text(locale,"Bình thường","Normal blood pressure")}</option><option value="ELEVATED">{text(locale,"Hơi cao","Elevated blood pressure")}</option><option value="HYPERTENSION_STAGE_1">{text(locale,"Tăng huyết áp mức 1","Stage 1 hypertension")}</option><option value="HYPERTENSION_STAGE_2">{text(locale,"Tăng huyết áp mức 2","Stage 2 hypertension")}</option><option value="HYPERTENSIVE_CRISIS">{text(locale,"Cảnh báo rất cao","Hypertensive crisis")}</option><option value="LOW">{text(locale,"Huyết áp thấp","Hypotension")}</option></select>
    </div>
    <div className="space-y-5">{shown.map((item) => {
      const meanArterialPressure = Math.round((item.systolic + 2 * item.diastolic) / 3);
      const pulsePressure = item.systolic - item.diastolic;
      const pressurePosition = Math.max(2, Math.min(98, ((item.systolic - 70) / 130) * 100));

      return <article key={item.id} className={`card history-card ${severityStyles[item.severity]}`}>
        <div className="history-card__ambient" aria-hidden="true"/>
        <div className="history-card__head">
          <p className="flex items-center gap-2 text-sm font-extrabold text-slate-600"><span className="history-card__icon"><CalendarDays size={16}/></span>{formatVietnamDateTime(item.measured_at)}</p>
          <div className="flex items-center gap-2"><span className="history-live" aria-hidden="true"><HeartPulse size={15}/></span><CategoryBadge category={item.category} locale={locale}/></div>
        </div>

        <div className="history-ecg" aria-hidden="true">
          <svg viewBox="0 0 800 32" preserveAspectRatio="none"><path d="M0 18 H88 L101 18 L108 11 L116 25 L126 3 L138 29 L148 18 H230 L243 18 L250 11 L258 25 L268 3 L280 29 L290 18 H372 L385 18 L392 11 L400 25 L410 3 L422 29 L432 18 H514 L527 18 L534 11 L542 25 L552 3 L564 29 L574 18 H656 L669 18 L676 11 L684 25 L694 3 L706 29 L716 18 H800"/></svg>
          <span>ECG MONITOR</span>
        </div>

        <div className="history-card__dashboard">
          <div className="history-metrics">
            <div className="history-metric"><span>SYS · {text(locale,"Tâm thu","Systolic")}</span><b>{item.systolic}</b><small>mmHg</small><i/></div>
            <div className="history-metric"><span>DIA · {text(locale,"Tâm trương","Diastolic")}</span><b>{item.diastolic}</b><small>mmHg</small><i/></div>
            <div className="history-metric history-metric--pulse"><span><HeartPulse size={13}/> {text(locale,"Nhịp tim","Pulse rate")}</span><b>{item.pulse}</b><small>{text(locale,"lần/phút","beats/min")}</small><i/></div>
          </div>

          <div className="history-clinical">
            <div className="history-clinical__title"><span><Gauge size={15}/> {text(locale,"Phổ huyết áp tâm thu","Systolic pressure spectrum")}</span><small>70–200 mmHg</small></div>
            <div className="pressure-gauge"><div className="pressure-gauge__marker" style={{ left: `${pressurePosition}%` }}><span>{item.systolic}</span></div></div>
            <div className="pressure-gauge__labels"><span>{text(locale,"Thấp","Low")}</span><span>{text(locale,"Tối ưu","Optimal")}</span><span>{text(locale,"Cao","High")}</span><span>{text(locale,"Rất cao","Severe")}</span></div>
            <div className="clinical-chips">
              <div><span>{text(locale,"MAP ước tính","Estimated MAP")}</span><b>{meanArterialPressure}</b><small>mmHg</small></div>
              <div><span>{text(locale,"Hiệu áp","Pulse pressure")}</span><b>{pulsePressure}</b><small>mmHg</small></div>
            </div>
          </div>
        </div>

        <div className="history-card__footer">
          <div className="history-note-wrap"><span><Stethoscope size={15}/></span>{item.note ? <p className="history-note">“{item.note}”</p> : <p className="history-note history-note--empty">{text(locale,"Không có ghi chú cho lần đo này","No clinical note for this reading")}</p>}</div>
          <div className="flex shrink-0 gap-2">
            <Link href={`/measurements/${item.id}`} className="history-detail-link">{text(locale,"Xem hồ sơ","View record")}<ChevronRight size={17}/></Link>
            <button type="button" aria-label={`Xóa lần đo lúc ${formatVietnamDateTime(item.measured_at)}`} className="history-delete" onClick={() => remove(item)}><Trash2 size={17}/></button>
          </div>
        </div>
      </article>;
    })}{!shown.length && <div className="card grid justify-items-center gap-3 p-8 text-center text-sm text-slate-500 sm:p-12"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-500"><Activity size={24}/></span>{text(locale,"Không tìm thấy lần đo nào.","No matching readings found.")}</div>}</div>
  </>;
}
