"use client";

import { Calendar, CalendarDays, CalendarRange, Clock3, FileText, MailCheck, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { text, type AppLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type ReportKind = "single-day" | "custom" | "week" | "month" | "last-7-days" | "last-30-days";
type SentResult = { recipient: string; records: number; period: { start: string; end: string } };

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const todayInVietnam = () => dateFormatter.format(new Date());
const toNoonUtc = (date: string) => new Date(`${date}T12:00:00Z`);
const addDays = (date: string, days: number) => {
  const value = toNoonUtc(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const formatDate = (date: string) => date.split("-").reverse().join("/");
const isDateOnly = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = toNoonUtc(date);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};
const isoWeekValue = (date: string) => {
  const value = toNoonUtc(date);
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1, 12));
  const week = Math.ceil((((value.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};
const weekRange = (weekValue: string) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4, 12));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
};
const monthRange = (monthValue: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const end = new Date(Date.UTC(year, month, 0, 12));
  return { start: `${match[1]}-${match[2]}-01`, end: end.toISOString().slice(0, 10) };
};

export function ReportRequestForm({ locale = "vi", email }: { locale?: AppLocale; email?: string }) {
  const today = useMemo(() => todayInVietnam(), []);
  const [kind, setKind] = useState<ReportKind>("custom");
  const [singleDate, setSingleDate] = useState(today);
  const [startDate, setStartDate] = useState(addDays(today, -6));
  const [endDate, setEndDate] = useState(today);
  const [week, setWeek] = useState(isoWeekValue(today));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<SentResult | null>(null);
  const tx = (vi: string, en: string) => text(locale, vi, en);

  const options: Array<{ value: ReportKind; label: string; icon: typeof Calendar; tone: string }> = [
    { value: "single-day", label: tx("Một ngày", "Single day"), icon: CalendarDays, tone: "from-cyan-500 to-blue-600" },
    { value: "custom", label: tx("Từ ngày đến ngày", "Custom range"), icon: CalendarRange, tone: "from-violet-500 to-fuchsia-600" },
    { value: "week", label: tx("Theo tuần", "By week"), icon: Clock3, tone: "from-emerald-500 to-teal-600" },
    { value: "month", label: tx("Theo tháng", "By month"), icon: Calendar, tone: "from-amber-500 to-orange-600" },
    { value: "last-7-days", label: tx("7 ngày gần nhất", "Last 7 days"), icon: Sparkles, tone: "from-sky-500 to-indigo-600" },
    { value: "last-30-days", label: tx("30 ngày gần nhất", "Last 30 days"), icon: FileText, tone: "from-rose-500 to-pink-600" },
  ];

  function selectedRange() {
    if (kind === "single-day") return { start: singleDate, end: singleDate };
    if (kind === "custom") return { start: startDate, end: endDate };
    if (kind === "week") return weekRange(week);
    if (kind === "month") return monthRange(month);
    if (kind === "last-7-days") return { start: addDays(today, -6), end: today };
    return { start: addDays(today, -29), end: today };
  }

  const range = selectedRange();
  const rangeLabel = range ? `${formatDate(range.start)} - ${formatDate(range.end)}` : tx("Chưa chọn khoảng hợp lệ", "Invalid range");

  async function submit() {
    const nextRange = selectedRange();
    if (!nextRange || !isDateOnly(nextRange.start) || !isDateOnly(nextRange.end)) {
      toast.error(tx("Khoảng báo cáo không hợp lệ", "Invalid report period"));
      return;
    }
    if (nextRange.start > nextRange.end) {
      toast.error(tx("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", "Start date must be before or equal to end date"));
      return;
    }

    setBusy(true);
    setSent(null);
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setBusy(false);
      toast.error(tx("Bạn cần đăng nhập để gửi báo cáo", "You need to sign in to send a report"));
      return;
    }
    const { data, error } = await supabase.functions.invoke("send-health-reports", {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { mode: "manual", reportKind: kind, startDate: nextRange.start, endDate: nextRange.end },
    });
    setBusy(false);

    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || tx("Không thể gửi báo cáo", "Unable to send report"));
      return;
    }

    const result = data as SentResult & { ok: true };
    setSent({ recipient: result.recipient, records: result.records, period: result.period });
    toast.success(tx("Đã gửi báo cáo về email", "Report email sent"));
  }

  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
    <section className="card form-panel overflow-hidden">
      <div className="border-b border-emerald-100 bg-gradient-to-br from-white via-cyan-50 to-violet-50 p-5 sm:p-6">
        <p className="eyebrow text-cyan-700"><MailCheck size={15} />{tx("Xuất báo cáo qua email", "Email report export")}</p>
        <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">{tx("Chọn khoảng cần tổng hợp", "Choose reporting period")}</h2>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {options.map(({ value, label, icon: Icon, tone }) => {
            const active = value === kind;
            return <button key={value} type="button" className={`min-h-24 rounded-2xl border p-4 text-left shadow-sm transition ${active ? "border-transparent bg-slate-950 text-white shadow-xl shadow-slate-300/60" : "border-slate-200 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"}`} onClick={() => setKind(value)}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon size={19} /></span>
              <span className="mt-3 block text-sm font-black">{label}</span>
            </button>;
          })}
        </div>

        {kind === "single-day" && <label className="block text-sm font-bold">{tx("Ngày cần xuất", "Report date")}<input type="date" className="input mt-2" value={singleDate} onChange={(event) => setSingleDate(event.target.value)} /></label>}
        {kind === "custom" && <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">{tx("Từ ngày", "From")}<input type="date" className="input mt-2" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="block text-sm font-bold">{tx("Đến ngày", "To")}<input type="date" className="input mt-2" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>}
        {kind === "week" && <label className="block text-sm font-bold">{tx("Tuần báo cáo", "Report week")}<input type="week" className="input mt-2" value={week} onChange={(event) => setWeek(event.target.value)} /></label>}
        {kind === "month" && <label className="block text-sm font-bold">{tx("Tháng báo cáo", "Report month")}<input type="month" className="input mt-2" value={month} onChange={(event) => setMonth(event.target.value)} /></label>}

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm text-slate-700">
          <b className="block text-cyan-900">{tx("Khoảng sẽ gửi", "Selected period")}</b>
          <span className="mt-1 block font-extrabold text-slate-950">{rangeLabel}</span>
          <span className="mt-1 block text-xs text-slate-500">{tx("Email nhận báo cáo", "Recipient email")}: {email || tx("email tài khoản", "account email")}</span>
        </div>

        <button type="button" disabled={busy} className="btn btn-primary w-full sm:w-auto" onClick={() => void submit()}>
          <Send size={18} />{busy ? tx("Đang gửi báo cáo...", "Sending report...") : tx("Gửi báo cáo về mail", "Send report email")}
        </button>
      </div>
    </section>

    <aside className="space-y-5">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-slate-950 via-teal-900 to-violet-900 p-5 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-cyan-100"><FileText size={24} /></span>
          <h2 className="mt-4 text-lg font-black">{tx("Nội dung email", "Email contents")}</h2>
        </div>
        <div className="space-y-3 p-5 text-sm text-slate-600">
          <p className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />{tx("Bảng chi tiết từng lần đo theo ngày.", "Detailed table for every reading by date.")}</p>
          <p className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-violet-500" />{tx("Đánh giá riêng cho từng lần đo.", "Assessment for each reading.")}</p>
          <p className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />{tx("Đánh giá tổng quan dựa trên toàn bộ khoảng đã chọn.", "Overall assessment based on the selected period.")}</p>
        </div>
      </section>

      {sent && <section className="card border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white"><MailCheck size={22} /></span>
          <div><h2 className="font-black text-emerald-950">{tx("Đã gửi báo cáo", "Report sent")}</h2><p className="text-xs text-emerald-700">{sent.recipient}</p></div>
        </div>
        <div className="mt-4 rounded-xl bg-white/80 p-4 text-sm text-slate-700">
          <b>{formatDate(sent.period.start)} - {formatDate(sent.period.end)}</b>
          <span className="mt-1 block">{tx("Số lần đo trong báo cáo", "Readings in report")}: {sent.records}</span>
        </div>
      </section>}
    </aside>
  </div>;
}
