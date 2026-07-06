import { createClient } from "npm:@supabase/supabase-js@2";

type ReportType = "weekly" | "monthly";
type RecordRow = { systolic: number; diastolic: number; pulse: number; category: string; severity: string; measured_at: string };

const categoryLabels: Record<string, string> = {
  LOW: "Huyết áp thấp", NORMAL: "Huyết áp bình thường", ELEVATED: "Huyết áp hơi cao",
  HYPERTENSION_STAGE_1: "Tăng huyết áp mức 1", HYPERTENSION_STAGE_2: "Tăng huyết áp mức 2",
  HYPERTENSIVE_CRISIS: "Cảnh báo huyết áp rất cao",
};
const categoryRank = ["NORMAL", "ELEVATED", "LOW", "HYPERTENSION_STAGE_1", "HYPERTENSION_STAGE_2", "HYPERTENSIVE_CRISIS"];
const esc = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
const average = (records: RecordRow[], key: "systolic" | "diastolic" | "pulse") => records.length ? Math.round(records.reduce((sum, record) => sum + record[key], 0) / records.length) : 0;
const deviation = (records: RecordRow[], key: "systolic" | "diastolic") => {
  if (!records.length) return 0;
  const avg = average(records, key);
  return Math.round(Math.sqrt(records.reduce((sum, record) => sum + (record[key] - avg) ** 2, 0) / records.length) * 10) / 10;
};
const dateOnly = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
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

function emailHtml(name: string, type: ReportType, period: { start: string; end: string }, records: RecordRow[]) {
  const sys = average(records, "systolic"); const dia = average(records, "diastolic"); const pulse = average(records, "pulse");
  const worst = records.reduce((value, record) => categoryRank.indexOf(record.category) > categoryRank.indexOf(value) ? record.category : value, "NORMAL");
  const dangerous = records.filter((record) => ["danger", "emergency"].includes(record.severity)).length;
  const title = type === "weekly" ? "Báo cáo huyết áp tuần" : "Báo cáo huyết áp tháng";
  const periodLabel = `${period.start.split("-").reverse().join("/")} – ${period.end.split("-").reverse().join("/")}`;
  const statusColor = worst === "NORMAL" ? "#059669" : worst === "HYPERTENSIVE_CRISIS" ? "#be123c" : "#d97706";
  const rows = records.slice().reverse().slice(0, 12).map((record) => `<tr><td style="padding:10px;border-bottom:1px solid #edf2f4;color:#52616b">${new Date(record.measured_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td style="padding:10px;border-bottom:1px solid #edf2f4;font-weight:700">${record.systolic}/${record.diastolic}</td><td style="padding:10px;border-bottom:1px solid #edf2f4">${record.pulse}</td></tr>`).join("");
  return `<!doctype html><html lang="vi"><body style="margin:0;background:#eef5f7;font-family:Arial,sans-serif;color:#173042"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="640" style="max-width:640px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(20,80,96,.12)"><tr><td style="padding:34px;background:linear-gradient(135deg,#0e7490,#164e63);color:#fff"><div style="font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;opacity:.8">Blood Pressure Tracker</div><h1 style="margin:12px 0 4px;font-size:28px">${title}</h1><p style="margin:0;opacity:.82">${periodLabel}</p></td></tr><tr><td style="padding:30px"><p style="margin-top:0;font-size:16px">Xin chào <strong>${esc(name)}</strong>,</p><p style="color:#52616b;line-height:1.7">Đây là báo cáo tự động được tổng hợp từ toàn bộ ${records.length} lần đo của bạn trong kỳ.</p>${records.length ? `<div style="margin:24px 0;padding:18px;border-radius:16px;background:#f3fafb;border-left:5px solid ${statusColor}"><strong style="color:${statusColor}">${categoryLabels[worst]}</strong><div style="margin-top:7px;color:#52616b">Mức đánh giá cao nhất ghi nhận trong kỳ</div></div><table role="presentation" width="100%" cellspacing="8"><tr>${[[sys,"SYS trung bình"],[dia,"DIA trung bình"],[pulse,"PULSE trung bình"]].map(([value,label]) => `<td align="center" style="padding:16px 6px;background:#f7fafb;border-radius:14px"><div style="font-size:28px;font-weight:800;color:#173042">${value}</div><div style="margin-top:5px;font-size:11px;color:#71808a">${label}</div></td>`).join("")}</tr></table><table role="presentation" width="100%" style="margin:20px 0"><tr><td style="padding:14px;background:#fff7ed;border-radius:12px;color:#9a3412">Dao động SYS/DIA: <strong>±${deviation(records,"systolic")} / ±${deviation(records,"diastolic")}</strong></td><td width="12"></td><td style="padding:14px;background:#fff1f2;border-radius:12px;color:#9f1239">Lần đo nguy hiểm: <strong>${dangerous}</strong></td></tr></table><h2 style="margin:28px 0 10px;font-size:17px">Các lần đo gần nhất trong kỳ</h2><table width="100%" cellspacing="0" style="font-size:13px"><tr style="background:#f7fafb"><th align="left" style="padding:10px">Thời gian</th><th align="left" style="padding:10px">SYS/DIA</th><th align="left" style="padding:10px">Nhịp tim</th></tr>${rows}</table>` : `<div style="margin:24px 0;padding:22px;border-radius:16px;background:#f7fafb;text-align:center;color:#64748b">Không có lần đo nào trong kỳ báo cáo.</div>`}<div style="margin-top:28px;padding:16px;border-radius:14px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6"><strong>Lưu ý y tế:</strong> Thông tin chỉ mang tính tham khảo. Nếu có triệu chứng bất thường, hãy liên hệ bác sĩ hoặc cơ sở y tế.</div></td></tr><tr><td style="padding:20px 30px;background:#f7fafb;color:#71808a;font-size:11px;text-align:center">Email tự động từ Blood Pressure Tracker · Bạn có thể thay đổi tùy chọn nhận mail trong Hồ sơ.</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (request) => {
  try {
    const cronSecret = Deno.env.get("REPORT_CRON_SECRET");
    if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) return new Response("Unauthorized", { status: 401 });
    const resendKey = Deno.env.get("RESEND_API_KEY"); const from = Deno.env.get("REPORT_EMAIL_FROM");
    if (!resendKey || !from) throw new Error("Missing RESEND_API_KEY or REPORT_EMAIL_FROM");
    const today = dateOnly(new Date());
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short" }).format(new Date());
    const dueTypes: ReportType[] = [];
    if (weekday === "Mon") dueTypes.push("weekly");
    if (today.endsWith("-01")) dueTypes.push("monthly");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getSecretKey(), { auth: { persistSession: false } });
    let sent = 0; let failed = 0;
    for (const type of dueTypes) {
      const period = periodFor(type, today);
      const enabledColumn = type === "weekly" ? "weekly_report_enabled" : "monthly_report_enabled";
      const { data: profiles, error: profileError } = await supabase.from("profiles").select("id,full_name,email").eq(enabledColumn, true);
      if (profileError) throw profileError;
      for (const profile of profiles ?? []) {
        const { data: existing } = await supabase.from("report_deliveries").select("id,status").eq("user_id", profile.id).eq("report_type", type).eq("period_start", period.start).maybeSingle();
        if (existing?.status === "sent") continue;
        const { data: records, error: recordsError } = await supabase.from("blood_pressure_records").select("systolic,diastolic,pulse,category,severity,measured_at").eq("user_id", profile.id).gte("measured_at", `${period.start}T00:00:00+07:00`).lt("measured_at", `${period.next}T00:00:00+07:00`).order("measured_at");
        if (recordsError) throw recordsError;
        const delivery = { user_id: profile.id, report_type: type, period_start: period.start, period_end: period.end, recipient: profile.email, status: "pending" };
        const { data: saved, error: saveError } = await supabase.from("report_deliveries").upsert(delivery, { onConflict: "user_id,report_type,period_start" }).select("id").single();
        if (saveError) throw saveError;
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [profile.email], subject: `${type === "weekly" ? "Báo cáo tuần" : "Báo cáo tháng"} · ${period.start} – ${period.end}`, html: emailHtml(profile.full_name, type, period, (records ?? []) as RecordRow[]) }) });
        const result = await response.json();
        if (response.ok) { sent++; await supabase.from("report_deliveries").update({ status: "sent", provider_message_id: result.id, sent_at: new Date().toISOString(), error_message: null }).eq("id", saved.id); }
        else { failed++; await supabase.from("report_deliveries").update({ status: "failed", error_message: JSON.stringify(result).slice(0, 1000) }).eq("id", saved.id); }
      }
    }
    return Response.json({ ok: true, date: today, dueTypes, sent, failed });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
});
