import { Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Gauge } from "lucide-react";

import type { PeriodHealthSummary } from "@/lib/health-summary";
import { CategoryBadge } from "@/components/measurements/CategoryBadge";
import { text, type AppLocale } from "@/lib/i18n";
import type { BloodPressureCategory } from "@/lib/blood-pressure";

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  stable: ArrowRight,
  insufficient: Activity,
};

const categoryOrder: BloodPressureCategory[] = [
  "LOW",
  "NORMAL",
  "ELEVATED",
  "HYPERTENSION_STAGE_1",
  "HYPERTENSION_STAGE_2",
  "HYPERTENSIVE_CRISIS",
];

const categoryNames: Record<BloodPressureCategory, [string, string]> = {
  LOW: ["Huyết áp thấp", "Low"],
  NORMAL: ["Bình thường", "Normal"],
  ELEVATED: ["Hơi cao", "Elevated"],
  HYPERTENSION_STAGE_1: ["Tăng HA mức 1", "Stage 1"],
  HYPERTENSION_STAGE_2: ["Tăng HA mức 2", "Stage 2"],
  HYPERTENSIVE_CRISIS: ["Rất cao", "Crisis range"],
};

const categoryDots: Record<BloodPressureCategory, string> = {
  LOW: "bg-indigo-500",
  NORMAL: "bg-emerald-500",
  ELEVATED: "bg-amber-400",
  HYPERTENSION_STAGE_1: "bg-orange-500",
  HYPERTENSION_STAGE_2: "bg-red-500",
  HYPERTENSIVE_CRISIS: "bg-red-800",
};

export function PeriodAssessment({ label, summary, locale = "vi" }: { label: string; summary: PeriodHealthSummary | null; locale?: AppLocale }) {
  if (!summary) {
    return <section className="card p-4 sm:p-6"><p className="eyebrow">{label}</p><h2 className="mt-2 text-lg font-extrabold sm:text-xl">{text(locale,"Chưa có dữ liệu trong kỳ","No readings in this period")}</h2><p className="mt-2 text-sm text-slate-500">{text(locale,"Hãy thêm các lần đo để nhận đánh giá tổng hợp.","Add readings to receive an aggregate clinical assessment.")}</p></section>;
  }
  const TrendIcon = trendIcon[summary.trend];
  return <section className="card card-hover overflow-hidden">
    <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/80 to-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{label}</p><h2 className="mt-2 text-lg font-extrabold sm:text-xl">{text(locale,`Đánh giá từ ${summary.count} lần đo`,`Assessment based on ${summary.count} readings`)}</h2></div><div className="text-right"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{text(locale,"Mức cần chú ý nhất","Highest concern")}</span><CategoryBadge category={summary.worstCategory} locale={locale}/></div></div>
      <div className="mt-5 grid grid-cols-3 gap-3">{[["SYS",summary.averages.systolic],["DIA",summary.averages.diastolic],["PULSE",summary.averages.pulse]].map(([name,value])=><div key={name} className="metric-tile"><b>{value}</b><span>{text(locale,`${name} trung bình`,`Mean ${name}`)}</span></div>)}</div>
    </div>
    <div className="space-y-4 p-4 sm:p-6">
      <p className="flex gap-3 text-sm leading-6 text-slate-600"><TrendIcon className="mt-0.5 shrink-0 text-cyan-700" size={20}/>{summary.assessment}</p>
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-700"><BarChart3 size={17} className="text-cyan-700"/>{text(locale,"Phân bố các mức huyết áp","Blood pressure distribution")}</h3>
        <div className="mt-3 grid gap-x-5 gap-y-2 text-sm min-[420px]:grid-cols-2">
          {categoryOrder.map((category) => <div key={category} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-600"><i className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryDots[category]}`}/>{text(locale,...categoryNames[category])}</span><b>{summary.categoryCounts[category]}</b></div>)}
        </div>
      </div>
      <div className="grid gap-3 text-sm min-[360px]:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-1.5 text-slate-500"><Gauge size={15}/>{text(locale,"Khoảng SYS / DIA","SYS / DIA range")}</span><b className="mt-1 block">{summary.ranges.systolic.min}–{summary.ranges.systolic.max} / {summary.ranges.diastolic.min}–{summary.ranges.diastolic.max} mmHg</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">{text(locale,"Dao động SYS/DIA","SYS/DIA variability")}</span><b className="mt-1 block">±{summary.variability.systolic} / ±{summary.variability.diastolic} mmHg</b></div><div className="rounded-xl bg-indigo-50 p-3"><span className="text-indigo-700">{text(locale,"Lần huyết áp thấp","Low readings")}</span><b className="mt-1 block text-indigo-900">{summary.categoryCounts.LOW}</b></div><div className="rounded-xl bg-rose-50 p-3"><span className="text-rose-700">{text(locale,"Lần đo nguy hiểm","High-risk readings")}</span><b className="mt-1 flex items-center gap-1 text-rose-900"><AlertTriangle size={15} className="text-rose-600"/>{summary.highRiskCount}</b></div></div>
      <p className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 text-xs leading-5 text-slate-600"><b className="text-slate-700">{text(locale,"Mốc tham khảo:","Reference thresholds:")}</b> {text(locale,"thấp khi SYS < 90 hoặc DIA < 60 và không đồng thời chạm ngưỡng cao; bình thường khi SYS 90–119 và DIA 60–79; các mức cao được xác định từ SYS ≥ 120 hoặc DIA ≥ 80.","low when SYS < 90 or DIA < 60 without also meeting a high threshold; normal when SYS is 90–119 and DIA is 60–79; elevated categories begin at SYS ≥ 120 or DIA ≥ 80.")}</p>
    </div>
  </section>;
}
