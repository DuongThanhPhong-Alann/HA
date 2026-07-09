import { createClient, type User } from "npm:@supabase/supabase-js@2";

type ScheduledReportType = "weekly" | "monthly";
type ReportType = ScheduledReportType | "manual";
type ManualReportKind = "single-day" | "custom" | "week" | "month" | "last-7-days" | "last-30-days";
type Locale = "vi" | "en";
type RecordRow = {
  systolic: number;
  diastolic: number;
  pulse: number;
  category: string;
  severity: string;
  warning_message: string | null;
  measured_at: string;
  note: string | null;
};
type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  language?: string | null;
  avatar_preset?: string | null;
  avatar_path?: string | null;
};
type Period = { start: string; end: string; next: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const riskOrder = ["NORMAL", "ELEVATED", "LOW", "HYPERTENSION_STAGE_1", "HYPERTENSION_STAGE_2", "HYPERTENSIVE_CRISIS"];
const reportDisclaimer = {
  vi: "Thông tin mang tính tham khảo. Nếu có triệu chứng bất thường, hãy liên hệ bác sĩ hoặc cơ sở y tế.",
  en: "This information is for reference only. If unusual symptoms occur, contact a doctor or medical facility.",
} satisfies Record<Locale, string>;
const categoryLabels: Record<Locale, Record<string, string>> = {
  vi: {
    LOW: "Huyết áp thấp",
    NORMAL: "Huyết áp trong giới hạn bình thường",
    ELEVATED: "Huyết áp tâm thu tăng",
    HYPERTENSION_STAGE_1: "Tăng huyết áp độ 1",
    HYPERTENSION_STAGE_2: "Tăng huyết áp độ 2",
    HYPERTENSIVE_CRISIS: "Ngưỡng cơn tăng huyết áp",
  },
  en: {
    LOW: "Hypotension",
    NORMAL: "Blood pressure within the normal range",
    ELEVATED: "Elevated systolic blood pressure",
    HYPERTENSION_STAGE_1: "Stage 1 hypertension",
    HYPERTENSION_STAGE_2: "Stage 2 hypertension",
    HYPERTENSIVE_CRISIS: "Hypertensive crisis range",
  },
};
const categoryMessages: Record<Locale, Record<string, string>> = {
  vi: {
    LOW: "Chỉ số thấp hơn mức thường gặp; nên nghỉ ngơi, đo lại và theo dõi triệu chứng như chóng mặt hoặc mệt nhiều.",
    NORMAL: "Chỉ số nằm trong vùng bình thường; tiếp tục theo dõi định kỳ và duy trì thói quen lành mạnh.",
    ELEVATED: "Huyết áp tâm thu hơi cao; nên nghỉ ngơi, hạn chế căng thẳng, giảm muối và theo dõi thêm.",
    HYPERTENSION_STAGE_1: "Chỉ số thuộc vùng tăng huyết áp mức 1; nên đo lặp lại vào các ngày khác nhau và tham khảo bác sĩ nếu tái diễn.",
    HYPERTENSION_STAGE_2: "Chỉ số đang cao; nên nghỉ ngơi, đo lại sau vài phút và liên hệ bác sĩ nếu vẫn cao hoặc lặp lại thường xuyên.",
    HYPERTENSIVE_CRISIS: "Chỉ số rất cao; hãy đo lại sau vài phút và tìm hỗ trợ y tế khẩn nếu có đau ngực, khó thở, yếu/tê tay chân, nhìn mờ, đau đầu dữ dội, khó nói hoặc choáng váng.",
  },
  en: {
    LOW: "The reading is below the usual range; rest, repeat the measurement, and watch for dizziness or significant fatigue.",
    NORMAL: "The reading is within the normal range; continue routine monitoring and healthy lifestyle habits.",
    ELEVATED: "Systolic blood pressure is elevated; rest, manage stress, reduce sodium intake, and keep monitoring.",
    HYPERTENSION_STAGE_1: "The reading is within stage 1 hypertension range; repeat on different days and consult a clinician if this pattern persists.",
    HYPERTENSION_STAGE_2: "The reading is high; rest, repeat it after several minutes, and contact a clinician if it remains high or recurs.",
    HYPERTENSIVE_CRISIS: "The reading is very high; repeat it after several minutes and seek urgent care if chest pain, dyspnea, weakness/numbness, visual changes, severe headache, speech difficulty, or dizziness occurs.",
  },
};
const categoryPalette: Record<string, { color: string; background: string; border: string }> = {
  LOW: { color: "#0369a1", background: "#e0f2fe", border: "#38bdf8" },
  NORMAL: { color: "#047857", background: "#ecfdf5", border: "#34d399" },
  ELEVATED: { color: "#b45309", background: "#fffbeb", border: "#f59e0b" },
  HYPERTENSION_STAGE_1: { color: "#c2410c", background: "#fff7ed", border: "#fb923c" },
  HYPERTENSION_STAGE_2: { color: "#be123c", background: "#fff1f2", border: "#fb7185" },
  HYPERTENSIVE_CRISIS: { color: "#7f1d1d", background: "#fef2f2", border: "#ef4444" },
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const tx = (locale: Locale, vi: string, en: string) => locale === "en" ? en : vi;
const esc = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const textResponse = (body: string, status = 200) => new Response(body, { status, headers: corsHeaders });

const average = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") =>
  records.length ? Math.round(records.reduce((sum, record) => sum + record[key], 0) / records.length) : 0;
const minimum = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") =>
  records.length ? Math.min(...records.map((record) => record[key])) : 0;
const maximum = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") =>
  records.length ? Math.max(...records.map((record) => record[key])) : 0;
const deviation = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") => {
  if (!records.length) return 0;
  const avg = average(records, key);
  return Math.round(Math.sqrt(records.reduce((sum, record) => sum + (record[key] - avg) ** 2, 0) / records.length) * 10) / 10;
};
const estimatedMap = (record: RecordRow) => Math.round((record.systolic + 2 * record.diastolic) / 3);
const pulsePressure = (record: RecordRow) => record.systolic - record.diastolic;
const dateOnly = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const formatDateTime = (value: string, locale: Locale) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
const formatDate = (value: string, locale: Locale) => locale === "en" ? value.split("-").reverse().join("/") : value.split("-").reverse().join("/");
const toNoonUtc = (date: string) => new Date(`${date}T12:00:00Z`);
const addDays = (date: string, days: number) => {
  const value = toNoonUtc(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const daysInclusive = (start: string, end: string) => Math.round((toNoonUtc(end).getTime() - toNoonUtc(start).getTime()) / 86_400_000) + 1;
const isDateOnly = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = toNoonUtc(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const normalizeLocale = (locale: unknown): Locale => locale === "en" ? "en" : "vi";
const initialsFor = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "B";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "P";
  return `${first}${last}`.toUpperCase();
};
const absoluteAppUrl = (appUrl: string, path: string) => {
  if (!/^https?:\/\//.test(appUrl)) return "";
  return `${appUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};
const getSecretKey = () => {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  return keys.default as string | undefined;
};

function periodFor(type: ScheduledReportType, localToday: string): Period {
  if (type === "weekly") return { start: addDays(localToday, -7), end: addDays(localToday, -1), next: localToday };
  const firstThisMonth = `${localToday.slice(0, 8)}01`;
  const previousDay = addDays(firstThisMonth, -1);
  return { start: `${previousDay.slice(0, 8)}01`, end: previousDay, next: firstThisMonth };
}

function manualPeriod(body: Record<string, unknown>): { period: Period; kind: ManualReportKind } {
  const start = body.startDate ?? body.periodStart;
  const end = body.endDate ?? body.periodEnd;
  if (!isDateOnly(start) || !isDateOnly(end)) throw new HttpError(400, "Khoảng ngày không hợp lệ.");
  if (start > end) throw new HttpError(400, "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
  const maxDays = Number(Deno.env.get("REPORT_MANUAL_MAX_DAYS") || "366");
  const totalDays = daysInclusive(start, end);
  if (totalDays < 1 || totalDays > maxDays) throw new HttpError(400, `Khoảng báo cáo tối đa ${maxDays} ngày.`);
  const rawKind = typeof body.reportKind === "string" ? body.reportKind : typeof body.type === "string" ? body.type : "custom";
  const allowedKinds: ManualReportKind[] = ["single-day", "custom", "week", "month", "last-7-days", "last-30-days"];
  const kind = allowedKinds.includes(rawKind as ManualReportKind) ? rawKind as ManualReportKind : "custom";
  return { period: { start, end, next: addDays(end, 1) }, kind };
}

function reportTitle(locale: Locale, type: ReportType, kind?: ManualReportKind) {
  if (type === "weekly") return tx(locale, "Báo cáo sức khỏe tuần", "Weekly health report");
  if (type === "monthly") return tx(locale, "Báo cáo sức khỏe tháng", "Monthly health report");
  if (kind === "single-day") return tx(locale, "Báo cáo sức khỏe một ngày", "Single-day health report");
  if (kind === "week") return tx(locale, "Báo cáo sức khỏe theo tuần", "Weekly range health report");
  if (kind === "month") return tx(locale, "Báo cáo sức khỏe theo tháng", "Monthly range health report");
  if (kind === "last-7-days") return tx(locale, "Báo cáo sức khỏe 7 ngày gần nhất", "Last 7 days health report");
  if (kind === "last-30-days") return tx(locale, "Báo cáo sức khỏe 30 ngày gần nhất", "Last 30 days health report");
  return tx(locale, "Báo cáo sức khỏe tùy chọn", "Custom health report");
}

function reportData(records: RecordRow[]) {
  const systolic = average(records, "systolic");
  const diastolic = average(records, "diastolic");
  const pulse = average(records, "pulse");
  const worst = records.reduce((value, record) => riskOrder.indexOf(record.category) > riskOrder.indexOf(value) ? record.category : value, "NORMAL");
  const dangerous = records.filter((record) => ["danger", "emergency"].includes(record.severity)).length;
  const meanMap = records.length ? Math.round(records.reduce((sum, record) => sum + estimatedMap(record), 0) / records.length) : 0;
  const meanPulsePressure = records.length ? Math.round(records.reduce((sum, record) => sum + pulsePressure(record), 0) / records.length) : 0;
  const categoryCounts = Object.fromEntries(riskOrder.map((category) => [category, records.filter((record) => record.category === category).length])) as Record<string, number>;
  let trend: "up" | "down" | "stable" | "insufficient" = "insufficient";
  if (records.length >= 4) {
    const ordered = [...records].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
    const middle = Math.floor(ordered.length / 2);
    const first = average(ordered.slice(0, middle), "systolic");
    const second = average(ordered.slice(middle), "systolic");
    trend = second - first > 5 ? "up" : first - second > 5 ? "down" : "stable";
  }
  return { systolic, diastolic, pulse, worst, dangerous, meanMap, meanPulsePressure, categoryCounts, trend };
}

function trendText(locale: Locale, trend: ReturnType<typeof reportData>["trend"]) {
  if (trend === "up") return tx(locale, "Huyết áp tâm thu trung bình có xu hướng tăng giữa hai nửa kỳ.", "Mean systolic blood pressure shows an upward trend between the two halves of this period.");
  if (trend === "down") return tx(locale, "Huyết áp tâm thu trung bình có xu hướng giảm giữa hai nửa kỳ.", "Mean systolic blood pressure shows a downward trend between the two halves of this period.");
  if (trend === "stable") return tx(locale, "Huyết áp tâm thu trung bình tương đối ổn định trong kỳ.", "Mean systolic blood pressure remained relatively stable during this period.");
  return tx(locale, "Cần ít nhất 4 lần đo để thực hiện đánh giá xu hướng.", "At least four readings are required for trend assessment.");
}

function readingAssessment(record: RecordRow, locale: Locale) {
  if (locale === "vi" && record.warning_message) return record.warning_message;
  return categoryMessages[locale][record.category] ?? categoryLabels[locale][record.category] ?? record.category;
}

function overallAssessment(locale: Locale, records: RecordRow[], data: ReturnType<typeof reportData>) {
  if (!records.length) return tx(locale, "Không có lần đo trong khoảng đã chọn, vì vậy chưa thể đánh giá xu hướng hay phân bố chỉ số.", "No readings were recorded in the selected period, so trend or distribution assessment is not available.");
  const variabilityHigh = deviation(records, "systolic") >= 15 || deviation(records, "diastolic") >= 10;
  const risk = data.dangerous > 0
    ? tx(locale, `Có ${data.dangerous} lần đo nằm trong nhóm cần chú ý cao; nên theo dõi sát và trao đổi với bác sĩ nếu tình trạng lặp lại.`, `${data.dangerous} reading(s) were in a high-attention range; monitor closely and discuss with a clinician if this recurs.`)
    : tx(locale, "Không ghi nhận lần đo thuộc nhóm nguy cơ cao trong kỳ.", "No high-risk readings were recorded during this period.");
  const variability = variabilityHigh
    ? tx(locale, "Độ dao động SYS/DIA khá lớn, nên đo vào thời điểm cố định và ghi chú bối cảnh đo.", "SYS/DIA variability is substantial; measure at consistent times and document the context.")
    : tx(locale, "Độ dao động giữa các lần đo chưa nổi bật.", "Visit-to-visit variability is not prominent.");
  return [
    tx(locale, `Khoảng báo cáo có ${records.length} lần đo; phân loại cao nhất là ${categoryLabels[locale][data.worst]}.`, `This report includes ${records.length} readings; the highest classification is ${categoryLabels[locale][data.worst]}.`),
    trendText(locale, data.trend),
    risk,
    variability,
  ].join(" ");
}

function metricTableRows(records: RecordRow[], locale: Locale, data: ReturnType<typeof reportData>) {
  const metrics = [
    ["SYS", tx(locale, "Huyết áp tâm thu", "Systolic blood pressure"), data.systolic, minimum(records, "systolic"), maximum(records, "systolic"), "mmHg", "#2563eb"],
    ["DIA", tx(locale, "Huyết áp tâm trương", "Diastolic blood pressure"), data.diastolic, minimum(records, "diastolic"), maximum(records, "diastolic"), "mmHg", "#7c3aed"],
    ["PULSE", tx(locale, "Tần số mạch", "Pulse rate"), data.pulse, minimum(records, "pulse"), maximum(records, "pulse"), tx(locale, "lần/phút", "beats/min"), "#db2777"],
    ["MAP", tx(locale, "Huyết áp động mạch trung bình ước tính", "Estimated mean arterial pressure"), data.meanMap, "-", "-", "mmHg", "#0891b2"],
    ["PP", tx(locale, "Hiệu áp trung bình", "Mean pulse pressure"), data.meanPulsePressure, "-", "-", "mmHg", "#ea580c"],
  ];
  return metrics.map(([code, label, mean, min, max, unit, color], index) => `<tr style="background:${index % 2 ? "#f8fafc" : "#ffffff"}">
    <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:900;color:${color}">${code}</td>
    <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#334155">${label}</td>
    <td align="center" style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:18px;font-weight:900;color:#0f172a">${mean}</td>
    <td align="center" style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b">${min}</td>
    <td align="center" style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b">${max}</td>
    <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:11px">${unit}</td>
  </tr>`).join("");
}

function emailHtml(name: string, type: ReportType, period: Period, records: RecordRow[], locale: Locale, appUrl: string, kind?: ManualReportKind, avatarUrl?: string | null) {
  const data = reportData(records);
  const title = reportTitle(locale, type, kind);
  const periodLabel = `${formatDate(period.start, locale)} - ${formatDate(period.end, locale)}`;
  const status = categoryPalette[data.worst] ?? categoryPalette.NORMAL;
  const url = /^https?:\/\//.test(appUrl) ? appUrl : "";
  const avatarAlt = esc(name);
  const initials = esc(initialsFor(name));
  const avatarCell = avatarUrl
    ? `<img src="${esc(avatarUrl)}" width="72" height="72" alt="${avatarAlt}" style="display:block;width:72px;height:72px;border:3px solid rgba(255,255,255,.45);border-radius:24px;object-fit:cover;background:#ffffff;box-shadow:0 12px 28px rgba(15,23,42,.24)">`
    : `<div style="width:72px;height:72px;border:3px solid rgba(255,255,255,.45);border-radius:24px;background:rgba(255,255,255,.16);color:#ffffff;font-size:22px;font-weight:900;line-height:72px;text-align:center;box-shadow:0 12px 28px rgba(15,23,42,.2)">${initials}</div>`;
  const detailRows = records.slice().reverse().map((record, index) => {
    const palette = categoryPalette[record.category] ?? categoryPalette.NORMAL;
    return `<tr style="background:${index % 2 ? "#f8fafc" : "#ffffff"}">
      <td style="padding:13px 10px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:12px;line-height:1.45;white-space:nowrap">${esc(formatDateTime(record.measured_at, locale))}</td>
      <td align="center" style="padding:13px 9px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:900;color:#1d4ed8">${record.systolic}</td>
      <td align="center" style="padding:13px 9px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:900;color:#6d28d9">${record.diastolic}</td>
      <td align="center" style="padding:13px 9px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:900;color:#be185d">${record.pulse}</td>
      <td align="center" style="padding:13px 9px;border-bottom:1px solid #e2e8f0;color:#0e7490">${estimatedMap(record)}</td>
      <td align="center" style="padding:13px 9px;border-bottom:1px solid #e2e8f0;color:#c2410c">${pulsePressure(record)}</td>
      <td style="padding:13px 10px;border-bottom:1px solid #e2e8f0"><span style="display:inline-block;padding:6px 10px;border:1px solid ${palette.border};border-radius:999px;background:${palette.background};color:${palette.color};font-size:11px;line-height:1.35;font-weight:900">${esc(categoryLabels[locale][record.category] ?? record.category)}</span></td>
      <td style="padding:13px 10px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:12px;line-height:1.65">${esc(readingAssessment(record, locale))}${record.note ? `<br><strong style="color:#0f172a">${tx(locale, "Ghi chú", "Note")}:</strong> ${esc(record.note)}` : ""}</td>
    </tr>`;
  }).join("");
  const distributionRows = riskOrder.map((category) => {
    const count = data.categoryCounts[category] ?? 0;
    const percentage = records.length ? Math.round(count / records.length * 100) : 0;
    const palette = categoryPalette[category] ?? categoryPalette.NORMAL;
    return `<tr>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#334155">${esc(categoryLabels[locale][category])}</td>
      <td align="center" style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:900;color:${palette.color}">${count}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0">
        <div style="height:9px;border-radius:999px;background:#e2e8f0;overflow:hidden"><div style="width:${percentage}%;height:9px;background:${palette.border}"></div></div>
        <div style="margin-top:4px;text-align:right;color:#64748b;font-size:10px">${percentage}%</div>
      </td>
    </tr>`;
  }).join("");
  const content = records.length ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr>
      <td style="padding:16px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe"><div style="font-size:11px;font-weight:900;color:#2563eb;letter-spacing:.6px">SYS AVG</div><div style="margin-top:7px;font-size:27px;font-weight:900;color:#1e3a8a">${data.systolic}<span style="font-size:12px;color:#64748b"> mmHg</span></div></td>
      <td width="10"></td>
      <td style="padding:16px;border-radius:16px;background:#f5f3ff;border:1px solid #ddd6fe"><div style="font-size:11px;font-weight:900;color:#7c3aed;letter-spacing:.6px">DIA AVG</div><div style="margin-top:7px;font-size:27px;font-weight:900;color:#4c1d95">${data.diastolic}<span style="font-size:12px;color:#64748b"> mmHg</span></div></td>
      <td width="10"></td>
      <td style="padding:16px;border-radius:16px;background:#fdf2f8;border:1px solid #fbcfe8"><div style="font-size:11px;font-weight:900;color:#db2777;letter-spacing:.6px">PULSE AVG</div><div style="margin-top:7px;font-size:27px;font-weight:900;color:#831843">${data.pulse}<span style="font-size:12px;color:#64748b"> ${tx(locale, "lần/phút", "bpm")}</span></div></td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border:1px solid ${status.border};border-radius:18px;background:${status.background}"><tr><td style="padding:18px;border-left:7px solid ${status.border};border-radius:18px">
      <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:#64748b;text-transform:uppercase">${tx(locale, "Phân loại cao nhất ghi nhận", "Highest recorded classification")}</div>
      <div style="margin-top:8px;font-size:20px;font-weight:900;color:${status.color}">${esc(categoryLabels[locale][data.worst])}</div>
    </td></tr></table>
    <div style="margin-top:18px;padding:18px;border:1px solid #bae6fd;border-radius:16px;background:#f0f9ff;color:#164e63;line-height:1.7"><strong style="color:#0e7490">${tx(locale, "Đánh giá tổng quan", "Overall assessment")}:</strong> ${esc(overallAssessment(locale, records, data))}</div>
    <h2 style="margin:28px 0 10px;font-size:18px;color:#0f172a">${tx(locale, "Bảng tổng hợp chỉ số", "Clinical metric summary")}</h2>
    <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;font-size:12px;line-height:1.45"><tr style="background:#0f172a;color:#ffffff"><th align="left" style="padding:12px">${tx(locale, "Mã", "Code")}</th><th align="left" style="padding:12px">${tx(locale, "Chỉ số", "Parameter")}</th><th style="padding:12px">${tx(locale, "Trung bình", "Mean")}</th><th style="padding:12px">Min</th><th style="padding:12px">Max</th><th align="left" style="padding:12px">${tx(locale, "Đơn vị", "Unit")}</th></tr>${metricTableRows(records, locale, data)}</table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px"><tr><td style="padding:14px;border-radius:14px;background:#fff7ed;color:#9a3412">${tx(locale, "Độ lệch chuẩn SYS/DIA", "SYS/DIA standard deviation")}: <strong>+/-${deviation(records, "systolic")} / +/-${deviation(records, "diastolic")} mmHg</strong></td><td width="10"></td><td style="padding:14px;border-radius:14px;background:#fff1f2;color:#9f1239">${tx(locale, "Lần đo nguy cơ cao", "High-risk readings")}: <strong>${data.dangerous}</strong></td></tr></table>
    <h2 style="margin:28px 0 10px;font-size:18px;color:#0f172a">${tx(locale, "Phân bố kết quả trong kỳ", "Reading distribution")}</h2>
    <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;font-size:12px"><tr style="background:#f1f5f9;color:#334155"><th align="left" style="padding:10px">${tx(locale, "Phân loại", "Classification")}</th><th style="padding:10px">${tx(locale, "Số lần", "Count")}</th><th style="padding:10px">${tx(locale, "Tỷ lệ", "Proportion")}</th></tr>${distributionRows}</table>
    <h2 style="margin:28px 0 10px;font-size:18px;color:#0f172a">${tx(locale, "Bảng chi tiết từng lần đo", "Detailed reading table")}</h2>
    <div style="overflow-x:auto"><table width="100%" cellspacing="0" cellpadding="0" style="min-width:880px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;font-size:12px;line-height:1.5"><tr style="background:#0f766e;color:#ffffff"><th align="left" style="padding:12px">${tx(locale, "Thời gian", "Date/time")}</th><th style="padding:12px">SYS</th><th style="padding:12px">DIA</th><th style="padding:12px">PULSE</th><th style="padding:12px">MAP</th><th style="padding:12px">PP</th><th align="left" style="padding:12px">${tx(locale, "Phân loại", "Classification")}</th><th align="left" style="padding:12px">${tx(locale, "Đánh giá từ lần đo", "Reading assessment")}</th></tr>${detailRows}</table></div>
    <div style="margin-top:18px;padding:14px;border-radius:14px;background:#f8fafc;color:#64748b;font-size:11px;line-height:1.65"><strong>${tx(locale, "Giải thích thuật ngữ", "Terminology")}:</strong> SYS = ${tx(locale, "huyết áp tâm thu", "systolic blood pressure")}; DIA = ${tx(locale, "huyết áp tâm trương", "diastolic blood pressure")}; PULSE = ${tx(locale, "tần số mạch", "pulse rate")}; MAP = ${tx(locale, "huyết áp động mạch trung bình ước tính theo công thức (SYS + 2 x DIA) / 3", "estimated mean arterial pressure calculated as (SYS + 2 x DIA) / 3")}; PP = ${tx(locale, "hiệu áp (SYS - DIA)", "pulse pressure (SYS - DIA)")}.</div>` : `<div style="margin:24px 0;padding:28px;border:1px solid #dbeafe;border-radius:18px;background:#eff6ff;text-align:center;color:#475569"><strong style="display:block;color:#1d4ed8;font-size:18px">${tx(locale, "Không có lần đo trong khoảng này", "No readings in this period")}</strong><span style="display:block;margin-top:8px">${tx(locale, "Email vẫn được gửi để xác nhận khoảng báo cáo bạn đã yêu cầu.", "This email confirms the reporting period you requested.")}</span></div>
    <div style="margin-top:18px;padding:18px;border:1px solid #bae6fd;border-radius:16px;background:#f0f9ff;color:#164e63;line-height:1.7"><strong style="color:#0e7490">${tx(locale, "Đánh giá tổng quan", "Overall assessment")}:</strong> ${esc(overallAssessment(locale, records, data))}</div>`;

  return `<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>${esc(title)}</title></head><body style="margin:0;background:#eaf2ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eaf2ff;background:linear-gradient(135deg,#e0f2fe,#ecfdf5 35%,#f5f3ff 70%,#fff1f2)"><tr><td align="center" style="padding:28px 10px">
    <table role="presentation" width="720" cellspacing="0" cellpadding="0" style="width:100%;max-width:720px;overflow:hidden;border:1px solid rgba(15,23,42,.08);border-radius:26px;background:#ffffff;box-shadow:0 22px 60px rgba(15,23,42,.18)">
      <tr><td style="padding:32px;background:#0f766e;background:linear-gradient(135deg,#0f766e,#2563eb 42%,#7c3aed 72%,#db2777);color:#fff">
        <table role="presentation" width="100%"><tr><td>
          <div style="font-size:12px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#d1fae5">BLOOD PRESSURE TRACKER</div>
          <h1 style="margin:12px 0 8px;font-size:30px;line-height:1.22;letter-spacing:.1px">${esc(title)}</h1>
          <p style="margin:0;color:#e0f2fe;font-size:14px;line-height:1.6;font-weight:700">${periodLabel}</p>
        </td><td width="88" align="right">${avatarCell}</td></tr></table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px"><tr>
          <td style="padding:12px;border-radius:14px;background:rgba(255,255,255,.13);color:#ffffff"><strong style="font-size:22px">${records.length}</strong><br><span style="font-size:11px;color:#dbeafe">${tx(locale, "lần đo", "readings")}</span></td>
          <td width="10"></td>
          <td style="padding:12px;border-radius:14px;background:rgba(255,255,255,.13);color:#ffffff"><strong style="font-size:22px">${data.dangerous}</strong><br><span style="font-size:11px;color:#dbeafe">${tx(locale, "cảnh báo", "alerts")}</span></td>
          <td width="10"></td>
          <td style="padding:12px;border-radius:14px;background:rgba(255,255,255,.13);color:#ffffff"><strong style="font-size:22px">${records.length ? data.meanMap : "-"}</strong><br><span style="font-size:11px;color:#dbeafe">MAP avg</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0;font-size:16px">${tx(locale, "Xin chào", "Hello")} <strong>${esc(name)}</strong>,</p>
        <p style="margin:9px 0 0;color:#475569;line-height:1.7">${tx(locale, `Báo cáo này tổng hợp ${records.length} lần đo trong khoảng bạn chọn, kèm bảng chỉ số theo ngày và đánh giá cho từng lần đo.`, `This report summarizes ${records.length} readings in the selected period, with daily measurements and an assessment for each reading.`)}</p>
        ${content}
        <div style="margin-top:28px;padding:18px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;color:#475569;font-size:12px;line-height:1.75"><strong style="color:#0f172a">${tx(locale, "Lưu ý y khoa quan trọng", "Important medical notice")}:</strong> ${tx(locale, "Báo cáo hỗ trợ theo dõi, không phải chẩn đoán và không thay thế thăm khám hoặc tư vấn của bác sĩ. Một kết quả đơn lẻ không đủ để xác định bệnh lý. Nếu chỉ số rất cao hoặc có triệu chứng bất thường, hãy liên hệ cấp cứu hoặc cơ sở y tế ngay.", "This report supports monitoring only; it is not a diagnosis and does not replace examination or advice from a qualified clinician. A single reading is insufficient to establish a diagnosis. Seek urgent medical care for very high readings or concerning symptoms.")}</div>
      </td></tr>
      <tr><td style="padding:22px 28px;background:#0f172a;text-align:center;color:#cbd5e1;font-size:11px;line-height:1.75"><strong style="color:#67e8f9">Blood Pressure Tracker</strong>${url ? `<br><a href="${esc(url)}" style="color:#a7f3d0;font-weight:800;text-decoration:none">${esc(url)}</a>` : ""}<br><span style="color:#ffffff;font-weight:900">${esc(reportDisclaimer[locale])}</span></td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function emailText(name: string, type: ReportType, period: Period, records: RecordRow[], locale: Locale, appUrl: string, kind?: ManualReportKind) {
  const data = reportData(records);
  const lines = [
    "BLOOD PRESSURE TRACKER",
    reportTitle(locale, type, kind).toUpperCase(),
    `${formatDate(period.start, locale)} - ${formatDate(period.end, locale)}`,
    "",
    `${tx(locale, "Xin chào", "Hello")} ${name},`,
    `${tx(locale, "Tổng số lần đo", "Total readings")}: ${records.length}`,
    `${tx(locale, "Đánh giá tổng quan", "Overall assessment")}: ${overallAssessment(locale, records, data)}`,
  ];
  if (records.length) {
    lines.push(
      `${tx(locale, "Phân loại cao nhất", "Highest classification")}: ${categoryLabels[locale][data.worst]}`,
      `SYS: ${data.systolic} mmHg (${minimum(records, "systolic")}-${maximum(records, "systolic")})`,
      `DIA: ${data.diastolic} mmHg (${minimum(records, "diastolic")}-${maximum(records, "diastolic")})`,
      `PULSE: ${data.pulse} ${tx(locale, "lần/phút", "beats/min")} (${minimum(records, "pulse")}-${maximum(records, "pulse")})`,
      `MAP: ${data.meanMap} mmHg`,
      `PP: ${data.meanPulsePressure} mmHg`,
      `${tx(locale, "Độ lệch chuẩn SYS/DIA", "SYS/DIA standard deviation")}: +/-${deviation(records, "systolic")} / +/-${deviation(records, "diastolic")} mmHg`,
      `${tx(locale, "Lần đo nguy cơ cao", "High-risk readings")}: ${data.dangerous}`,
      "",
      tx(locale, "CHI TIẾT CÁC LẦN ĐO", "READING DETAILS"),
      ...records.slice().reverse().map((record) => `${formatDateTime(record.measured_at, locale)} | SYS ${record.systolic} | DIA ${record.diastolic} | PULSE ${record.pulse} | MAP ${estimatedMap(record)} | PP ${pulsePressure(record)} | ${categoryLabels[locale][record.category]} | ${readingAssessment(record, locale)}${record.note ? ` | ${tx(locale, "Ghi chú", "Note")}: ${record.note}` : ""}`),
    );
  } else {
    lines.push(tx(locale, "Không có lần đo trong khoảng báo cáo.", "No readings were recorded during this period."));
  }
  lines.push("", tx(locale, "LƯU Ý Y KHOA: Báo cáo chỉ hỗ trợ theo dõi, không phải chẩn đoán và không thay thế tư vấn của bác sĩ.", "MEDICAL NOTICE: This report supports monitoring only; it is not a diagnosis and does not replace professional medical advice."));
  if (/^https?:\/\//.test(appUrl)) lines.push(appUrl);
  lines.push(reportDisclaimer[locale]);
  return lines.join("\n");
}

async function parseJsonBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body");
    return body as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Nội dung yêu cầu không hợp lệ.");
  }
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = getSecretKey();
  if (!url || !key) throw new Error("Missing Supabase service credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function authenticateUser(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!token || !url || !anonKey) throw new HttpError(401, "Bạn cần đăng nhập để gửi báo cáo.");
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Phiên đăng nhập không hợp lệ.");
  return data.user as User;
}

async function profileForUser(supabase: ReturnType<typeof createClient>, user: User): Promise<ProfileRow> {
  let { data, error } = await supabase.from("profiles").select("id,full_name,email,language,avatar_preset,avatar_path").eq("id", user.id).maybeSingle();
  if (error && /(language|avatar_preset|avatar_path)/i.test(error.message)) {
    const fallback = await supabase.from("profiles").select("id,full_name,email").eq("id", user.id).maybeSingle();
    data = fallback.data ? { ...fallback.data, language: "vi", avatar_preset: null, avatar_path: null } : null;
    error = fallback.error;
  }
  if (error) throw error;
  if (data) return data as ProfileRow;
  const fallbackName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0] ?? "Người dùng";
  return { id: user.id, full_name: fallbackName, email: user.email ?? null, language: "vi" };
}

async function fetchRecords(supabase: ReturnType<typeof createClient>, userId: string, period: Period) {
  const { data, error } = await supabase
    .from("blood_pressure_records")
    .select("systolic,diastolic,pulse,category,severity,warning_message,measured_at,note")
    .eq("user_id", userId)
    .gte("measured_at", `${period.start}T00:00:00+07:00`)
    .lt("measured_at", `${period.next}T00:00:00+07:00`)
    .order("measured_at");
  if (error) throw error;
  return (data ?? []) as RecordRow[];
}

async function avatarUrlForProfile(supabase: ReturnType<typeof createClient>, profile: ProfileRow, appUrl: string) {
  if (profile.avatar_preset) return absoluteAppUrl(appUrl, `/avatars/presets/${profile.avatar_preset}.webp`);
  if (!profile.avatar_path) return null;
  const { data, error } = await supabase.storage.from("bp-images").createSignedUrl(profile.avatar_path, 60 * 60 * 24 * 365);
  if (error) {
    console.error(`Unable to create avatar signed URL for ${profile.id}`, error);
    return null;
  }
  return data?.signedUrl ?? null;
}

async function sendEmail(payload: { from: string; to: string; subject: string; html: string; text: string; resendKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${payload.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: payload.from, to: [payload.to], subject: payload.subject, html: payload.html, text: payload.text }),
  });
  const raw = await response.text();
  let result: Record<string, unknown> = {};
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch {
    result = { raw };
  }
  if (!response.ok) throw new Error(JSON.stringify(result).slice(0, 1000));
  return result;
}

async function sendReport(options: {
  supabase: ReturnType<typeof createClient>;
  profile: ProfileRow;
  period: Period;
  type: ReportType;
  kind?: ManualReportKind;
  resendKey: string;
  from: string;
  appUrl: string;
}) {
  const recipient = options.profile.email;
  if (!recipient) throw new Error("Profile does not have a recipient email");
  const locale = normalizeLocale(options.profile.language);
  const records = await fetchRecords(options.supabase, options.profile.id, options.period);
  const title = reportTitle(locale, options.type, options.kind);
  const subject = `${title} · ${options.period.start} - ${options.period.end}`;
  const name = options.profile.full_name || tx(locale, "Người dùng", "User");
  const avatarUrl = await avatarUrlForProfile(options.supabase, options.profile, options.appUrl);
  const result = await sendEmail({
    from: options.from,
    to: recipient,
    subject,
    html: emailHtml(name, options.type, options.period, records, locale, options.appUrl, options.kind, avatarUrl),
    text: emailText(name, options.type, options.period, records, locale, options.appUrl, options.kind),
    resendKey: options.resendKey,
  });
  return { recipient, records, providerMessageId: typeof result.id === "string" ? result.id : null };
}

async function runManual(request: Request) {
  const body = await parseJsonBody(request);
  if (body.mode !== "manual") throw new HttpError(400, "Chế độ báo cáo không hợp lệ.");
  const user = await authenticateUser(request);
  const supabase = serviceClient();
  const profile = await profileForUser(supabase, user);
  if (!profile.email && user.email) profile.email = user.email;
  const { period, kind } = manualPeriod(body);
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("REPORT_EMAIL_FROM");
  const appUrl = Deno.env.get("PUBLIC_APP_URL") || "";
  if (!resendKey || !from) throw new Error("Missing RESEND_API_KEY or REPORT_EMAIL_FROM");
  if (!profile.email) throw new Error("Profile does not have a recipient email");
  const { data: delivery, error: deliveryError } = await supabase.from("report_deliveries").insert({
    user_id: profile.id,
    report_type: "manual",
    report_kind: kind,
    period_start: period.start,
    period_end: period.end,
    recipient: profile.email,
    status: "pending",
    record_count: 0,
  }).select("id,created_at").single();
  if (deliveryError) throw deliveryError;

  try {
    const sent = await sendReport({ supabase, profile, period, type: "manual", kind, resendKey, from, appUrl });
    const patch = {
      status: "sent",
      provider_message_id: sent.providerMessageId,
      sent_at: new Date().toISOString(),
      error_message: null,
      record_count: sent.records.length,
    };
    await supabase.from("report_deliveries").update(patch).eq("id", delivery.id);
    return json({
      ok: true,
      mode: "manual",
      delivery: { id: delivery.id, created_at: delivery.created_at, ...patch },
      period: { start: period.start, end: period.end },
      recipient: sent.recipient,
      records: sent.records.length,
      providerMessageId: sent.providerMessageId,
    });
  } catch (error) {
    await supabase.from("report_deliveries").update({
      status: "failed",
      error_message: (error instanceof Error ? error.message : "Unknown error").slice(0, 1000),
    }).eq("id", delivery.id);
    throw error;
  }
}

async function runScheduled(request: Request) {
  const cronSecret = Deno.env.get("REPORT_CRON_SECRET");
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) return textResponse("Unauthorized", 401);
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("REPORT_EMAIL_FROM");
  const appUrl = Deno.env.get("PUBLIC_APP_URL") || "";
  if (!resendKey || !from) throw new Error("Missing RESEND_API_KEY or REPORT_EMAIL_FROM");
  const today = dateOnly(new Date());
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short" }).format(new Date());
  const dueTypes: ScheduledReportType[] = [];
  if (weekday === "Mon") dueTypes.push("weekly");
  if (today.endsWith("-01")) dueTypes.push("monthly");
  const supabase = serviceClient();
  let sent = 0;
  let failed = 0;

  for (const type of dueTypes) {
    const period = periodFor(type, today);
    const enabledColumn = type === "weekly" ? "weekly_report_enabled" : "monthly_report_enabled";
    let { data: profiles, error: profileError } = await supabase.from("profiles").select("id,full_name,email,language,avatar_preset,avatar_path").eq(enabledColumn, true);
    if (profileError && /(language|avatar_preset|avatar_path)/i.test(profileError.message)) {
      const fallback = await supabase.from("profiles").select("id,full_name,email").eq(enabledColumn, true);
      profiles = fallback.data?.map((profile) => ({ ...profile, language: "vi", avatar_preset: null, avatar_path: null })) ?? null;
      profileError = fallback.error;
    }
    if (profileError) throw profileError;

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      if (!profile.email) {
        failed++;
        console.error(`Skipping ${type} report for ${profile.id}: missing recipient email`);
        continue;
      }
      const { data: existing } = await supabase.from("report_deliveries").select("id,status").eq("user_id", profile.id).eq("report_type", type).eq("period_start", period.start).maybeSingle();
      if (existing?.status === "sent") continue;
      let saved = existing;
      if (saved) {
        const { error: updateError } = await supabase.from("report_deliveries").update({
          period_end: period.end,
          recipient: profile.email,
          status: "pending",
          error_message: null,
        }).eq("id", saved.id);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: saveError } = await supabase.from("report_deliveries").insert({
          user_id: profile.id,
          report_type: type,
          report_kind: null,
          period_start: period.start,
          period_end: period.end,
          recipient: profile.email,
          status: "pending",
          record_count: 0,
        }).select("id").single();
        if (saveError) throw saveError;
        saved = inserted;
      }
      try {
        const result = await sendReport({ supabase, profile, period, type, resendKey, from, appUrl });
        sent++;
        await supabase.from("report_deliveries").update({ status: "sent", provider_message_id: result.providerMessageId, sent_at: new Date().toISOString(), error_message: null, record_count: result.records.length }).eq("id", saved.id);
      } catch (error) {
        failed++;
        await supabase.from("report_deliveries").update({ status: "failed", error_message: (error instanceof Error ? error.message : "Unknown error").slice(0, 1000) }).eq("id", saved.id);
        console.error(`Failed to send ${type} report for ${profile.id}`, error);
      }
    }
  }
  return json({ ok: true, date: today, dueTypes, sent, failed });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return textResponse("ok");
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  try {
    if (request.headers.has("x-cron-secret")) return await runScheduled(request);
    return await runManual(request);
  } catch (error) {
    console.error(error);
    const status = error instanceof HttpError ? error.status : 500;
    return json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, status);
  }
});
