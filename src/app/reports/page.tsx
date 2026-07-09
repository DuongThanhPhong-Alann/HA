import { FileText, MailCheck, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ReportRequestForm } from "@/components/reports/ReportRequestForm";
import { getLocale } from "@/lib/i18n-server";
import { text } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <AppShell><div className="mx-auto max-w-6xl p-4 sm:p-5 md:p-8">
    <header className="measurement-page-heading mb-6 sm:mb-7">
      <span className="measurement-page-heading__heart"><FileText /></span>
      <div className="min-w-0">
        <p className="eyebrow page-eyebrow"><MailCheck size={15} />{text(locale, "Báo cáo", "Reports")}</p>
        <h1 className="page-heading mt-1 text-2xl font-black sm:text-3xl">{text(locale, "Xuất báo cáo sức khỏe", "Export health report")}</h1>
        <p className="page-subheading mt-2 text-sm">{text(locale, "Chọn khoảng đo và gửi bảng tổng hợp chi tiết về email.", "Choose a measurement period and email a detailed summary table.")}</p>
      </div>
      <span className="measurement-page-heading__safe"><ShieldCheck size={16} />{text(locale, "Gửi bảo mật", "Secure send")}</span>
      <div className="measurement-heading-ecg" aria-hidden="true"><svg viewBox="0 0 420 36" preserveAspectRatio="none"><path d="M0 20 H95 L105 20 L113 12 L122 29 L134 3 L147 33 L158 20 H260 L270 20 L278 12 L287 29 L299 3 L312 33 L323 20 H420" /></svg></div>
    </header>

    <ReportRequestForm locale={locale} email={user?.email} />
  </div></AppShell>;
}
