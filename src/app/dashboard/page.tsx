import { endOfMonth, endOfWeek, startOfMonth, startOfWeek, subDays } from "date-fns";
import { ArrowRight, CalendarDays, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import { BloodPressureChart } from "@/components/dashboard/BloodPressureChart";
import { PeriodAssessment } from "@/components/dashboard/PeriodAssessment";
import { AppShell } from "@/components/layout/AppShell";
import { CategoryBadge } from "@/components/measurements/CategoryBadge";
import { summarizeMeasurements } from "@/lib/health-summary";
import { formatVietnamDateTime } from "@/lib/date-time";
import { text } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import type { Measurement } from "@/types/database";

const inRange = (record: Measurement, start: Date, end: Date) => {
  const time = new Date(record.measured_at).getTime();
  return time >= start.getTime() && time <= end.getTime();
};
const average = (records: Measurement[], key: "systolic" | "diastolic" | "pulse") =>
  records.length ? Math.round(records.reduce((sum, record) => sum + record[key], 0) / records.length) : "—";

export default async function DashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("blood_pressure_records").select("*").order("measured_at", { ascending: false });
  const records = (data ?? []) as Measurement[];
  const now = new Date();
  const latest = records[0];
  const recent = records.filter((record) => new Date(record.measured_at) >= subDays(now, 7));
  const weeklyRecords = records.filter((record) => inRange(record, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })));
  const monthlyRecords = records.filter((record) => inRange(record, startOfMonth(now), endOfMonth(now)));
  const dangers = records.filter((record) => new Date(record.measured_at) >= subDays(now, 30) && ["danger", "emergency"].includes(record.severity)).length;

  return <AppShell><div className="mx-auto max-w-7xl p-5 md:p-8">
    <header className="hero-panel animate-rise">
      <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div><p className="eyebrow text-cyan-100"><Sparkles size={14}/> {text(locale,"Tổng quan sức khỏe","Health overview")}</p><h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{text(locale,"Xin chào","Welcome")}{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50/80">{text(locale,"Mỗi lần đo đều được đánh giá ngay. Báo cáo tuần và tháng giúp bạn nhìn thấy xu hướng dài hạn rõ ràng hơn.","Each reading is assessed immediately. Weekly and monthly summaries make long-term blood pressure trends easier to interpret.")}</p></div>
        <Link href="/measurements/new" className="btn bg-white text-cyan-900 shadow-lg hover:-translate-y-0.5"><Plus size={19}/>{text(locale,"Thêm lần đo mới","Add new reading")}</Link>
      </div>
    </header>

    {latest ? <section className="card card-hover mt-6 animate-rise overflow-hidden [animation-delay:80ms]">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <div className="flex-1"><p className="eyebrow"><CalendarDays size={14}/> {text(locale,"Lần đo gần nhất","Latest reading")} · {formatVietnamDateTime(latest.measured_at)}</p><div className="mt-5 flex gap-5 sm:gap-10">{[[latest.systolic,"SYS"],[latest.diastolic,"DIA"],[latest.pulse,"PULSE"]].map(([value,label])=><div key={label}><b className="text-4xl font-black tracking-tight">{value}</b><p className="mt-1 text-xs font-bold text-slate-400">{label}</p></div>)}</div></div>
        <div><CategoryBadge category={latest.category} locale={locale}/><Link href={`/measurements/${latest.id}`} className="mt-3 flex items-center gap-1 text-sm font-bold text-cyan-700">{text(locale,"Xem đánh giá","View assessment")} <ArrowRight size={16}/></Link></div>
      </div>
    </section> : <section className="card mt-6 p-9 text-center"><h2 className="text-xl font-extrabold">{text(locale,"Chưa có lần đo nào","No readings recorded")}</h2><p className="mt-2 text-slate-500">{text(locale,"Thêm kết quả đầu tiên để bắt đầu theo dõi.","Add your first reading to begin monitoring.")}</p></section>}

    <section className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-5">{[[records.length,text(locale,"Tổng lần đo","Total readings")],[average(recent,"systolic"),text(locale,"SYS TB · 7 ngày","Mean SYS · 7 days")],[average(recent,"diastolic"),text(locale,"DIA TB · 7 ngày","Mean DIA · 7 days")],[average(recent,"pulse"),text(locale,"PULSE TB · 7 ngày","Mean pulse · 7 days")],[dangers,text(locale,"Cảnh báo · 30 ngày","Alerts · 30 days")]].map(([value,label], index)=><div key={label} className="card stat-card animate-rise" style={{animationDelay:`${120 + index * 40}ms`}}><b>{value}</b><p>{label}</p></div>)}</section>

    <div className="grid gap-5 xl:grid-cols-2"><PeriodAssessment locale={locale} label={text(locale,"Tuần hiện tại","Current week")} summary={summarizeMeasurements(weeklyRecords,locale)}/><PeriodAssessment locale={locale} label={text(locale,"Tháng hiện tại","Current month")} summary={summarizeMeasurements(monthlyRecords,locale)}/></div>
    <div className="mt-5"><BloodPressureChart records={records} locale={locale}/></div>
    <p className="medical-note mt-5">{text(locale,"Thông tin chỉ mang tính tham khảo. Nếu có triệu chứng bất thường, hãy liên hệ bác sĩ hoặc cơ sở y tế.","This information is for monitoring purposes only and does not replace professional medical advice. Seek clinical care for concerning symptoms.")}</p>
  </div></AppShell>;
}
