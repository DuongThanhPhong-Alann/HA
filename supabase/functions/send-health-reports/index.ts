import { createClient } from "npm:@supabase/supabase-js@2";

type ReportType = "weekly" | "monthly";
type Locale = "vi" | "en";
type RecordRow = {
  systolic: number;
  diastolic: number;
  pulse: number;
  category: string;
  severity: string;
  measured_at: string;
  note: string | null;
};

const categories = ["NORMAL", "ELEVATED", "LOW", "HYPERTENSION_STAGE_1", "HYPERTENSION_STAGE_2", "HYPERTENSIVE_CRISIS"];
const categoryLabels: Record<Locale, Record<string, string>> = {
  vi: {
    LOW: "Huyết áp thấp", NORMAL: "Huyết áp trong giới hạn bình thường", ELEVATED: "Huyết áp tâm thu tăng",
    HYPERTENSION_STAGE_1: "Tăng huyết áp độ 1", HYPERTENSION_STAGE_2: "Tăng huyết áp độ 2",
    HYPERTENSIVE_CRISIS: "Ngưỡng cơn tăng huyết áp",
  },
  en: {
    LOW: "Hypotension", NORMAL: "Blood pressure within the normal range", ELEVATED: "Elevated systolic blood pressure",
    HYPERTENSION_STAGE_1: "Stage 1 hypertension", HYPERTENSION_STAGE_2: "Stage 2 hypertension",
    HYPERTENSIVE_CRISIS: "Hypertensive crisis range",
  },
};
const esc = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
const tx = (locale: Locale, vi: string, en: string) => locale === "en" ? en : vi;
const average = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") => records.length ? Math.round(records.reduce((sum, record) => sum + record[key], 0) / records.length) : 0;
const minimum = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") => records.length ? Math.min(...records.map((record) => record[key])) : 0;
const maximum = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") => records.length ? Math.max(...records.map((record) => record[key])) : 0;
const deviation = (records: RecordRow[], key: "systolic" | "diastolic") => {
  if (!records.length) return 0;
  const avg = average(records, key);
  return Math.round(Math.sqrt(records.reduce((sum, record) => sum + (record[key] - avg) ** 2, 0) / records.length) * 10) / 10;
};
const estimatedMap = (record: RecordRow) => Math.round((record.systolic + 2 * record.diastolic) / 3);
const pulsePressure = (record: RecordRow) => record.systolic - record.diastolic;
const dateOnly = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const formatDateTime = (value: string, locale: Locale) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
const formatDate = (value: string, locale: Locale) => locale === "en" ? value.split("-").reverse().join("/") : value.split("-").reverse().join("/");
const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const getSecretKey = () => {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  return keys.default;
};

function periodFor(type: ReportType, localToday: string) {
  if (type === "weekly") return { start: addDays(localToday, -7), end: addDays(localToday, -1), next: localToday };
  const firstThisMonth = `${localToday.slice(0, 8)}01`;
  const previousDay = addDays(firstThisMonth, -1);
  return { start: `${previousDay.slice(0, 8)}01`, end: previousDay, next: firstThisMonth };
}

function reportData(records: RecordRow[]) {
  const systolic = average(records, "systolic");
  const diastolic = average(records, "diastolic");
  const pulse = average(records, "pulse");
  const worst = records.reduce((value, record) => categories.indexOf(record.category) > categories.indexOf(value) ? record.category : value, "NORMAL");
  const dangerous = records.filter((record) => ["danger", "emergency"].includes(record.severity)).length;
  const meanMap = records.length ? Math.round(records.reduce((sum, record) => sum + estimatedMap(record), 0) / records.length) : 0;
  const meanPulsePressure = records.length ? Math.round(records.reduce((sum, record) => sum + pulsePressure(record), 0) / records.length) : 0;
  let trend: "up" | "down" | "stable" | "insufficient" = "insufficient";
  if (records.length >= 4) {
    const ordered = [...records].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
    const middle = Math.floor(ordered.length / 2);
    const first = average(ordered.slice(0, middle), "systolic");
    const second = average(ordered.slice(middle), "systolic");
    trend = second - first > 5 ? "up" : first - second > 5 ? "down" : "stable";
  }
  return { systolic, diastolic, pulse, worst, dangerous, meanMap, meanPulsePressure, trend };
}

function trendText(locale: Locale, trend: ReturnType<typeof reportData>["trend"]) {
  if (trend === "up") return tx(locale, "Huyết áp tâm thu trung bình có xu hướng tăng giữa hai nửa kỳ.", "Mean systolic blood pressure shows an upward trend between the two halves of this period.");
  if (trend === "down") return tx(locale, "Huyết áp tâm thu trung bình có xu hướng giảm giữa hai nửa kỳ.", "Mean systolic blood pressure shows a downward trend between the two halves of this period.");
  if (trend === "stable") return tx(locale, "Huyết áp tâm thu trung bình tương đối ổn định trong kỳ.", "Mean systolic blood pressure remained relatively stable during this period.");
  return tx(locale, "Cần ít nhất 4 lần đo để thực hiện đánh giá xu hướng.", "At least four readings are required for trend assessment.");
}

function emailHtml(name: string, type: ReportType, period: { start: string; end: string }, records: RecordRow[], locale: Locale, appUrl: string) {
  const data = reportData(records);
  const title = type === "weekly" ? tx(locale, "Báo cáo sức khỏe tuần", "Weekly health report") : tx(locale, "Báo cáo sức khỏe tháng", "Monthly health report");
  const periodLabel = `${formatDate(period.start, locale)} – ${formatDate(period.end, locale)}`;
  const statusColor = data.worst === "NORMAL" ? "#059669" : data.worst === "HYPERTENSIVE_CRISIS" ? "#be123c" : "#d97706";
  const statusBackground = data.worst === "NORMAL" ? "#ecfdf5" : data.worst === "HYPERTENSIVE_CRISIS" ? "#fff1f2" : "#fffbeb";
  const url = /^https?:\/\//.test(appUrl) ? appUrl : "";
  const metricRows = [
    ["SYS", tx(locale, "Huyết áp tâm thu", "Systolic blood pressure"), data.systolic, minimum(records, "systolic"), maximum(records, "systolic"), "mmHg"],
    ["DIA", tx(locale, "Huyết áp tâm trương", "Diastolic blood pressure"), data.diastolic, minimum(records, "diastolic"), maximum(records, "diastolic"), "mmHg"],
    ["PULSE", tx(locale, "Tần số mạch", "Pulse rate"), data.pulse, minimum(records, "pulse"), maximum(records, "pulse"), tx(locale, "lần/phút", "beats/min")],
    ["MAP", tx(locale, "Huyết áp động mạch trung bình ước tính", "Estimated mean arterial pressure"), data.meanMap, "—", "—", "mmHg"],
    ["PP", tx(locale, "Hiệu áp trung bình", "Mean pulse pressure"), data.meanPulsePressure, "—", "—", "mmHg"],
  ].map(([code, label, mean, min, max, unit], index) => `<tr style="background:${index % 2 ? "#f7fbf8" : "#ffffff"}"><td style="padding:11px;border-bottom:1px solid #e4f0e9;font-weight:800;color:#087f5f">${code}</td><td style="padding:11px;border-bottom:1px solid #e4f0e9;color:#49645b">${label}</td><td align="center" style="padding:11px;border-bottom:1px solid #e4f0e9;font-size:17px;font-weight:800;color:#163c31">${mean}</td><td align="center" style="padding:11px;border-bottom:1px solid #e4f0e9;color:#60766f">${min}</td><td align="center" style="padding:11px;border-bottom:1px solid #e4f0e9;color:#60766f">${max}</td><td style="padding:11px;border-bottom:1px solid #e4f0e9;color:#7a8d86;font-size:11px">${unit}</td></tr>`).join("");
  const distributionRows = categories.map((category) => {
    const count = records.filter((record) => record.category === category).length;
    if (!count) return "";
    const percentage = Math.round(count / records.length * 100);
    return `<tr><td style="padding:9px;border-bottom:1px solid #e7f0eb;color:#49645b">${esc(categoryLabels[locale][category])}</td><td align="center" style="padding:9px;border-bottom:1px solid #e7f0eb;font-weight:800">${count}</td><td align="right" style="padding:9px;border-bottom:1px solid #e7f0eb;color:#60766f">${percentage}%</td></tr>`;
  }).join("");
  const readingRows = records.slice().reverse().map((record) => `<tr>
    <td style="padding:10px 7px;border-bottom:1px solid #e5eee9;color:#526b62;font-size:11px;white-space:nowrap">${esc(formatDateTime(record.measured_at, locale))}</td>
    <td align="center" style="padding:10px 7px;border-bottom:1px solid #e5eee9;font-weight:800;color:#173f33">${record.systolic}</td>
    <td align="center" style="padding:10px 7px;border-bottom:1px solid #e5eee9;font-weight:800;color:#173f33">${record.diastolic}</td>
    <td align="center" style="padding:10px 7px;border-bottom:1px solid #e5eee9;color:#8a4b09">${record.pulse}</td>
    <td align="center" style="padding:10px 7px;border-bottom:1px solid #e5eee9;color:#526b62">${estimatedMap(record)}</td>
    <td align="center" style="padding:10px 7px;border-bottom:1px solid #e5eee9;color:#526b62">${pulsePressure(record)}</td>
    <td style="padding:10px 7px;border-bottom:1px solid #e5eee9;color:#526b62;font-size:11px"><strong>${esc(categoryLabels[locale][record.category] ?? record.category)}</strong>${record.note ? `<br><span style="color:#84958f">${tx(locale, "Ghi chú", "Note")}: ${esc(record.note)}</span>` : ""}</td>
  </tr>`).join("");
  const reportContent = records.length ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border:1px solid #dcebe3;border-radius:14px;background:${statusBackground}"><tr><td style="padding:18px;border-left:5px solid ${statusColor}"><div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#758a82;text-transform:uppercase">${tx(locale, "Phân tầng cao nhất ghi nhận", "Highest recorded classification")}</div><div style="margin-top:6px;font-size:18px;font-weight:800;color:${statusColor}">${esc(categoryLabels[locale][data.worst])}</div></td></tr></table>
    <h2 style="margin:28px 0 10px;font-size:17px;color:#174738">${tx(locale, "Bảng tổng hợp chỉ số", "Clinical metric summary")}</h2>
    <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dfece5;border-radius:12px;overflow:hidden;font-size:12px"><tr style="background:#eaf8f0;color:#27644f"><th align="left" style="padding:10px">${tx(locale,"Mã","Code")}</th><th align="left" style="padding:10px">${tx(locale,"Chỉ số","Parameter")}</th><th style="padding:10px">${tx(locale,"Trung bình","Mean")}</th><th style="padding:10px">Min</th><th style="padding:10px">Max</th><th align="left" style="padding:10px">${tx(locale,"Đơn vị","Unit")}</th></tr>${metricRows}</table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px"><tr><td style="padding:14px;border-radius:12px;background:#fffbeb;color:#92400e">${tx(locale,"Độ lệch chuẩn SYS/DIA","SYS/DIA standard deviation")}: <strong>±${deviation(records,"systolic")} / ±${deviation(records,"diastolic")} mmHg</strong></td><td width="10"></td><td style="padding:14px;border-radius:12px;background:#fff1f2;color:#9f1239">${tx(locale,"Lần đo nguy cơ cao","High-risk readings")}: <strong>${data.dangerous}</strong></td></tr></table>
    <div style="margin-top:16px;padding:16px;border:1px solid #cce9da;border-radius:12px;background:#f0fdf4;color:#376052;line-height:1.65"><strong style="color:#087f5f">${tx(locale,"Đánh giá xu hướng","Trend assessment")}:</strong> ${esc(trendText(locale,data.trend))}</div>
    <h2 style="margin:28px 0 10px;font-size:17px;color:#174738">${tx(locale,"Phân bố kết quả trong kỳ","Reading distribution")}</h2>
    <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dfece5;border-radius:12px;overflow:hidden;font-size:12px"><tr style="background:#eaf8f0;color:#27644f"><th align="left" style="padding:9px">${tx(locale,"Phân loại","Classification")}</th><th style="padding:9px">${tx(locale,"Số lần","Count")}</th><th align="right" style="padding:9px">${tx(locale,"Tỷ lệ","Proportion")}</th></tr>${distributionRows}</table>
    <h2 style="margin:28px 0 10px;font-size:17px;color:#174738">${tx(locale,"Bảng đầy đủ các lần đo","Complete reading table")}</h2>
    <div style="overflow-x:auto"><table width="100%" cellspacing="0" cellpadding="0" style="min-width:620px;border:1px solid #dfece5;border-radius:12px;overflow:hidden;font-size:12px"><tr style="background:#eaf8f0;color:#27644f"><th align="left" style="padding:9px">${tx(locale,"Thời gian","Date/time")}</th><th style="padding:9px">SYS</th><th style="padding:9px">DIA</th><th style="padding:9px">PULSE</th><th style="padding:9px">MAP</th><th style="padding:9px">PP</th><th align="left" style="padding:9px">${tx(locale,"Phân loại và ghi chú","Classification and note")}</th></tr>${readingRows}</table></div>
    <div style="margin-top:18px;padding:14px;border-radius:12px;background:#f7faf8;color:#667a72;font-size:11px;line-height:1.65"><strong>${tx(locale,"Giải thích thuật ngữ","Terminology")}:</strong> SYS = ${tx(locale,"huyết áp tâm thu","systolic blood pressure")}; DIA = ${tx(locale,"huyết áp tâm trương","diastolic blood pressure")}; PULSE = ${tx(locale,"tần số mạch","pulse rate")}; MAP = ${tx(locale,"huyết áp động mạch trung bình ước tính theo công thức (SYS + 2 × DIA) / 3","estimated mean arterial pressure calculated as (SYS + 2 × DIA) / 3")}; PP = ${tx(locale,"hiệu áp (SYS − DIA)","pulse pressure (SYS − DIA)")}.</div>` : `<div style="margin:24px 0;padding:24px;border:1px solid #dcebe3;border-radius:16px;background:#f4faf6;text-align:center;color:#647a72">${tx(locale,"Không có lần đo nào trong kỳ báo cáo.","No readings were recorded during this reporting period.")}</div>`;

  return `<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>${esc(title)}</title></head><body style="margin:0;background:#edf7f1;font-family:Arial,Helvetica,sans-serif;color:#173f33"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf7f1"><tr><td align="center" style="padding:28px 10px"><table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:100%;max-width:680px;overflow:hidden;border:1px solid #d9ebe1;border-radius:22px;background:#fff;box-shadow:0 14px 42px rgba(5,78,59,.12)">
    <tr><td style="padding:30px;background:#075f49;background:linear-gradient(135deg,#075f49,#0d7c68);color:#fff"><table role="presentation" width="100%"><tr><td><div style="font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#a7f3d0">♥ &nbsp; BLOOD PRESSURE TRACKER</div><h1 style="margin:12px 0 5px;font-size:28px;line-height:1.2">${esc(title)}</h1><p style="margin:0;color:#d1fae5">${periodLabel}</p></td><td width="72" align="center"><div style="width:56px;height:56px;border:1px solid rgba(255,255,255,.25);border-radius:18px;background:rgba(255,255,255,.1);font-size:30px;line-height:56px">✚</div></td></tr></table><div style="margin-top:22px;border-top:1px solid rgba(255,255,255,.15);padding-top:14px;font-size:12px;color:#bbf7d0">${tx(locale,"Theo dõi đều đặn · Chủ động sức khỏe · Sống xanh mỗi ngày","Monitor consistently · Act proactively · Live healthier every day")}</div></td></tr>
    <tr><td style="padding:28px"><p style="margin:0;font-size:16px">${tx(locale,"Xin chào","Hello")} <strong>${esc(name)}</strong>,</p><p style="margin:9px 0 0;color:#526b62;line-height:1.7">${tx(locale,`Báo cáo tự động này tổng hợp đầy đủ ${records.length} lần đo trong kỳ, giúp bạn theo dõi xu hướng huyết áp và tần số mạch theo thời gian.`,`This automated report summarizes all ${records.length} readings in the period to support longitudinal monitoring of blood pressure and pulse rate.`)}</p>${reportContent}
    <div style="margin-top:28px;padding:17px;border:1px solid #dce7e1;border-radius:14px;background:#f8faf9;color:#63776f;font-size:11px;line-height:1.7"><strong style="color:#174738">${tx(locale,"Lưu ý y khoa quan trọng","Important medical notice")}:</strong> ${tx(locale,"Báo cáo hỗ trợ theo dõi, không phải chẩn đoán và không thay thế thăm khám hoặc tư vấn của bác sĩ. Một kết quả đơn lẻ không đủ để xác định bệnh lý. Nếu chỉ số rất cao hoặc xuất hiện đau ngực, khó thở, yếu/tê tay chân, nhìn mờ, đau đầu dữ dội, khó nói hay choáng váng, hãy liên hệ cấp cứu hoặc cơ sở y tế ngay.","This report supports monitoring only; it is not a diagnosis and does not replace examination or advice from a qualified clinician. A single reading is insufficient to establish a diagnosis. Seek emergency medical care for severely elevated readings accompanied by chest pain, dyspnea, focal weakness or numbness, visual disturbance, severe headache, speech difficulty, or dizziness.")}</div>
    </td></tr><tr><td style="padding:22px 28px;background:#f0f8f3;text-align:center;color:#6b7f77;font-size:11px;line-height:1.7"><strong style="color:#087f5f">Blood Pressure Tracker</strong><br>${tx(locale,"Nền tảng theo dõi huyết áp cá nhân theo phong cách y tế xanh.","A green-health platform for personal blood pressure monitoring.")}${url ? `<br><a href="${esc(url)}" style="color:#087f5f;font-weight:700;text-decoration:none">${esc(url)}</a>` : ""}<br>${tx(locale,"Bạn có thể thay đổi lịch nhận báo cáo trong mục Hồ sơ.","You can change your report schedule in Profile settings.")}</td></tr>
  </table></td></tr></table></body></html>`;
}

function emailText(name: string, type: ReportType, period: { start: string; end: string }, records: RecordRow[], locale: Locale, appUrl: string) {
  const data = reportData(records);
  const title = type === "weekly" ? tx(locale,"BÁO CÁO SỨC KHỎE TUẦN","WEEKLY HEALTH REPORT") : tx(locale,"BÁO CÁO SỨC KHỎE THÁNG","MONTHLY HEALTH REPORT");
  const lines = [
    "BLOOD PRESSURE TRACKER",
    tx(locale,"Theo dõi đều đặn · Chủ động sức khỏe · Sống xanh mỗi ngày","Monitor consistently · Act proactively · Live healthier every day"),
    "",
    title,
    `${formatDate(period.start,locale)} – ${formatDate(period.end,locale)}`,
    "",
    `${tx(locale,"Xin chào","Hello")} ${name},`,
    `${tx(locale,"Tổng số lần đo","Total readings")}: ${records.length}`,
  ];
  if (records.length) {
    lines.push(
      `${tx(locale,"Phân tầng cao nhất","Highest classification")}: ${categoryLabels[locale][data.worst]}`,
      `SYS: ${data.systolic} mmHg (${minimum(records,"systolic")}–${maximum(records,"systolic")})`,
      `DIA: ${data.diastolic} mmHg (${minimum(records,"diastolic")}–${maximum(records,"diastolic")})`,
      `PULSE: ${data.pulse} ${tx(locale,"lần/phút","beats/min")} (${minimum(records,"pulse")}–${maximum(records,"pulse")})`,
      `MAP: ${data.meanMap} mmHg`, `PP: ${data.meanPulsePressure} mmHg`,
      `${tx(locale,"Độ lệch chuẩn SYS/DIA","SYS/DIA standard deviation")}: ±${deviation(records,"systolic")} / ±${deviation(records,"diastolic")} mmHg`,
      `${tx(locale,"Lần đo nguy cơ cao","High-risk readings")}: ${data.dangerous}`,
      `${tx(locale,"Xu hướng","Trend")}: ${trendText(locale,data.trend)}`, "",
      tx(locale,"CHI TIẾT CÁC LẦN ĐO","READING DETAILS"),
      ...records.slice().reverse().map((record) => `${formatDateTime(record.measured_at,locale)} | SYS ${record.systolic} | DIA ${record.diastolic} | PULSE ${record.pulse} | MAP ${estimatedMap(record)} | PP ${pulsePressure(record)} | ${categoryLabels[locale][record.category]}${record.note ? ` | ${tx(locale,"Ghi chú","Note")}: ${record.note}` : ""}`),
    );
  } else lines.push(tx(locale,"Không có lần đo trong kỳ.","No readings were recorded during this period."));
  lines.push("", tx(locale,"LƯU Ý Y KHOA: Báo cáo chỉ hỗ trợ theo dõi, không phải chẩn đoán và không thay thế tư vấn của bác sĩ.","MEDICAL NOTICE: This report supports monitoring only; it is not a diagnosis and does not replace professional medical advice."));
  if (/^https?:\/\//.test(appUrl)) lines.push("", appUrl);
  return lines.join("\n");
}

Deno.serve(async (request) => {
  try {
    const cronSecret = Deno.env.get("REPORT_CRON_SECRET");
    if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) return new Response("Unauthorized", { status: 401 });
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("REPORT_EMAIL_FROM");
    const appUrl = Deno.env.get("PUBLIC_APP_URL") || "";
    if (!resendKey || !from) throw new Error("Missing RESEND_API_KEY or REPORT_EMAIL_FROM");
    const today = dateOnly(new Date());
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short" }).format(new Date());
    const dueTypes: ReportType[] = [];
    if (weekday === "Mon") dueTypes.push("weekly");
    if (today.endsWith("-01")) dueTypes.push("monthly");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getSecretKey(), { auth: { persistSession: false } });
    let sent = 0;
    let failed = 0;
    for (const type of dueTypes) {
      const period = periodFor(type, today);
      const enabledColumn = type === "weekly" ? "weekly_report_enabled" : "monthly_report_enabled";
      let { data: profiles, error: profileError } = await supabase.from("profiles").select("id,full_name,email,language").eq(enabledColumn, true);
      if (profileError && /language/i.test(profileError.message)) {
        const fallback = await supabase.from("profiles").select("id,full_name,email").eq(enabledColumn, true);
        profiles = fallback.data?.map((profile) => ({ ...profile, language: "vi" })) ?? null;
        profileError = fallback.error;
      }
      if (profileError) throw profileError;
      for (const profile of profiles ?? []) {
        const locale: Locale = profile.language === "en" ? "en" : "vi";
        const { data: existing } = await supabase.from("report_deliveries").select("id,status").eq("user_id", profile.id).eq("report_type", type).eq("period_start", period.start).maybeSingle();
        if (existing?.status === "sent") continue;
        const { data: records, error: recordsError } = await supabase.from("blood_pressure_records").select("systolic,diastolic,pulse,category,severity,measured_at,note").eq("user_id", profile.id).gte("measured_at", `${period.start}T00:00:00+07:00`).lt("measured_at", `${period.next}T00:00:00+07:00`).order("measured_at");
        if (recordsError) throw recordsError;
        const typedRecords = (records ?? []) as RecordRow[];
        const delivery = { user_id: profile.id, report_type: type, period_start: period.start, period_end: period.end, recipient: profile.email, status: "pending" };
        const { data: saved, error: saveError } = await supabase.from("report_deliveries").upsert(delivery, { onConflict: "user_id,report_type,period_start" }).select("id").single();
        if (saveError) throw saveError;
        const subject = `${type === "weekly" ? tx(locale,"Báo cáo sức khỏe tuần","Weekly health report") : tx(locale,"Báo cáo sức khỏe tháng","Monthly health report")} · ${period.start} – ${period.end}`;
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [profile.email], subject, html: emailHtml(profile.full_name, type, period, typedRecords, locale, appUrl), text: emailText(profile.full_name, type, period, typedRecords, locale, appUrl) }) });
        const result = await response.json();
        if (response.ok) {
          sent++;
          await supabase.from("report_deliveries").update({ status: "sent", provider_message_id: result.id, sent_at: new Date().toISOString(), error_message: null }).eq("id", saved.id);
        } else {
          failed++;
          await supabase.from("report_deliveries").update({ status: "failed", error_message: JSON.stringify(result).slice(0, 1000) }).eq("id", saved.id);
        }
      }
    }
    return Response.json({ ok: true, date: today, dueTypes, sent, failed });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
});
