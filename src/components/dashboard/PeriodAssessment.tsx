import { Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import type { PeriodHealthSummary } from "@/lib/health-summary";
import { CategoryBadge } from "@/components/measurements/CategoryBadge";

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  stable: ArrowRight,
  insufficient: Activity,
};

export function PeriodAssessment({ label, summary }: { label: string; summary: PeriodHealthSummary | null }) {
  if (!summary) {
    return <section className="card p-4 sm:p-6"><p className="eyebrow">{label}</p><h2 className="mt-2 text-lg font-extrabold sm:text-xl">Chưa có dữ liệu trong kỳ</h2><p className="mt-2 text-sm text-slate-500">Hãy thêm các lần đo để nhận đánh giá tổng hợp.</p></section>;
  }
  const TrendIcon = trendIcon[summary.trend];
  return <section className="card card-hover overflow-hidden">
    <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/80 to-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{label}</p><h2 className="mt-2 text-lg font-extrabold sm:text-xl">Đánh giá từ {summary.count} lần đo</h2></div><CategoryBadge category={summary.worstCategory}/></div>
      <div className="mt-5 grid grid-cols-3 gap-3">{[["SYS",summary.averages.systolic],["DIA",summary.averages.diastolic],["PULSE",summary.averages.pulse]].map(([name,value])=><div key={name} className="metric-tile"><b>{value}</b><span>{name} trung bình</span></div>)}</div>
    </div>
    <div className="space-y-4 p-4 sm:p-6">
      <p className="flex gap-3 text-sm leading-6 text-slate-600"><TrendIcon className="mt-0.5 shrink-0 text-cyan-700" size={20}/>{summary.assessment}</p>
      <div className="grid gap-3 text-sm min-[360px]:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Dao động SYS/DIA</span><b className="mt-1 block">±{summary.variability.systolic} / ±{summary.variability.diastolic}</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Lần đo nguy hiểm</span><b className="mt-1 flex items-center gap-1"><AlertTriangle size={15} className="text-rose-600"/>{summary.highRiskCount}</b></div></div>
    </div>
  </section>;
}
