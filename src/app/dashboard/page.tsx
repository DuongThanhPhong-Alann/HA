import { endOfMonth, endOfWeek, startOfMonth, startOfWeek, subDays } from "date-fns";
import { Activity, ArrowRight, CalendarDays, ClipboardList, Gauge, HeartPulse, ShieldAlert, Sparkles } from "lucide-react";
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
  const stats = [
    { value: records.length, label: text(locale,"Tổng lần đo","Total readings"), icon: ClipboardList, tone: "violet" },
    { value: average(recent,"systolic"), label: text(locale,"SYS TB · 7 ngày","Mean SYS · 7 days"), icon: Gauge, tone: "rose" },
    { value: average(recent,"diastolic"), label: text(locale,"DIA TB · 7 ngày","Mean DIA · 7 days"), icon: Activity, tone: "cyan" },
    { value: average(recent,"pulse"), label: text(locale,"PULSE TB · 7 ngày","Mean pulse · 7 days"), icon: HeartPulse, tone: "emerald" },
    { value: dangers, label: text(locale,"Cảnh báo · 30 ngày","Alerts · 30 days"), icon: ShieldAlert, tone: "amber" },
  ];

  return <AppShell><div className="mx-auto max-w-7xl p-5 md:p-8">
    <header className="hero-panel animate-rise">
      <div className="hero-medical-grid" aria-hidden="true"/>
      <div className="hero-heartbeat" aria-hidden="true"><HeartPulse/><svg viewBox="0 0 260 45" preserveAspectRatio="none"><path d="M0 24 H52 L62 24 L69 14 L77 34 L88 3 L100 39 L111 24 H160 L170 24 L177 14 L185 34 L196 3 L208 39 L219 24 H260"/></svg></div>
      <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div><p className="eyebrow text-cyan-100"><Sparkles size={14}/> {text(locale,"Tổng quan sức khỏe","Health overview")}</p><h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{text(locale,"Xin chào","Welcome")}{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50/80">{text(locale,"Mỗi lần đo đều được đánh giá ngay. Báo cáo tuần và tháng giúp bạn nhìn thấy xu hướng dài hạn rõ ràng hơn.","Each reading is assessed immediately. Weekly and monthly summaries make long-term blood pressure trends easier to interpret.")}</p></div>
      </div>
    </header>

    {latest ? <section className="card vital-monitor mt-6 animate-rise overflow-hidden [animation-delay:80ms]">
      <div className="vital-monitor__top"><p className="eyebrow"><span className="vital-monitor__live"/><CalendarDays size={14}/> {text(locale,"Lần đo gần nhất","Latest reading")} · {formatVietnamDateTime(latest.measured_at)}</p><CategoryBadge category={latest.category} locale={locale}/></div>
      <div className="vital-monitor__ecg" aria-hidden="true"><svg viewBox="0 0 900 42" preserveAspectRatio="none"><path d="M0 24 H120 L132 24 L140 14 L150 34 L163 3 L177 38 L190 24 H330 L342 24 L350 14 L360 34 L373 3 L387 38 L400 24 H540 L552 24 L560 14 L570 34 L583 3 L597 38 L610 24 H750 L762 24 L770 14 L780 34 L793 3 L807 38 L820 24 H900"/></svg></div>
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-center">
        <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-4">{[[latest.systolic,"SYS",text(locale,"Tâm thu","Systolic"),"mmHg"],[latest.diastolic,"DIA",text(locale,"Tâm trương","Diastolic"),"mmHg"],[latest.pulse,"PULSE",text(locale,"Nhịp tim","Pulse rate"),text(locale,"lần/phút","beats/min")]].map(([value,label,name,unit],index)=><div key={label} className={`dashboard-vital dashboard-vital--${index+1}`}><span>{label}</span><b>{value}</b><small>{name} · {unit}</small><i aria-hidden="true"/></div>)}</div>
        <div className="vital-monitor__action"><span className="vital-monitor__orbit"><HeartPulse size={24}/></span><p>{text(locale,"Đánh giá tự động đã sẵn sàng","Automated assessment is ready")}</p><Link href={`/measurements/${latest.id}`} className="mt-2 inline-flex items-center gap-1 font-extrabold text-cyan-700">{text(locale,"Xem đánh giá","View assessment")} <ArrowRight size={16}/></Link></div>
      </div>
    </section> : <section className="card mt-6 p-9 text-center"><h2 className="text-xl font-extrabold">{text(locale,"Chưa có lần đo nào","No readings recorded")}</h2><p className="mt-2 text-slate-500">{text(locale,"Thêm kết quả đầu tiên để bắt đầu theo dõi.","Add your first reading to begin monitoring.")}</p></section>}

    <section className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-5">{stats.map(({value,label,icon:Icon,tone},index)=><div key={label} className={`card dashboard-stat dashboard-stat--${tone} animate-rise`} style={{animationDelay:`${120 + index * 40}ms`}}><div className="dashboard-stat__head"><span><Icon size={18}/></span><i>LIVE</i></div><b>{value}</b><p>{label}</p><div className="dashboard-stat__signal" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div></div>)}</section>

    <div className="dashboard-health-grid grid gap-5 xl:grid-cols-2"><PeriodAssessment locale={locale} label={text(locale,"Tuần hiện tại","Current week")} summary={summarizeMeasurements(weeklyRecords,locale)}/><PeriodAssessment locale={locale} label={text(locale,"Tháng hiện tại","Current month")} summary={summarizeMeasurements(monthlyRecords,locale)}/></div>
    <div className="mt-5"><BloodPressureChart records={records} locale={locale}/></div>
    <p className="medical-note mt-5">{text(locale,"Thông tin chỉ mang tính tham khảo. Nếu có triệu chứng bất thường, hãy liên hệ bác sĩ hoặc cơ sở y tế.","This information is for monitoring purposes only and does not replace professional medical advice. Seek clinical care for concerning symptoms.")}</p>
  </div></AppShell>;
}
