import { AppShell } from "@/components/layout/AppShell";
import { MeasurementList } from "@/components/measurements/MeasurementList";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n-server";
import { text } from "@/lib/i18n";
import type { Measurement } from "@/types/database";
import { HeartPulse, ShieldCheck } from "lucide-react";

export default async function MeasurementsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("blood_pressure_records").select("*").order("measured_at", { ascending: false });
  return <AppShell><div className="mx-auto max-w-5xl p-4 sm:p-5 md:p-8"><header className="measurement-page-heading mb-6 sm:mb-7"><span className="measurement-page-heading__heart"><HeartPulse/></span><div className="min-w-0"><p className="eyebrow page-eyebrow">{text(locale,"Nhật ký","Clinical log")}</p><h1 className="page-heading mt-1 text-2xl font-black sm:text-3xl">{text(locale,"Lịch sử đo","Measurement history")}</h1><p className="page-subheading mt-2 text-sm">{text(locale,"Theo dõi từng thay đổi và xem lại đánh giá sức khỏe theo thời gian.","Review every change and health assessment over time.")}</p></div><span className="measurement-page-heading__safe"><ShieldCheck size={16}/>{text(locale,"Đã bảo vệ","Protected")}</span><div className="measurement-heading-ecg" aria-hidden="true"><svg viewBox="0 0 420 36" preserveAspectRatio="none"><path d="M0 20 H95 L105 20 L113 12 L122 29 L134 3 L147 33 L158 20 H260 L270 20 L278 12 L287 29 L299 3 L312 33 L323 20 H420"/></svg></div></header><MeasurementList initial={(data ?? []) as Measurement[]} locale={locale}/></div></AppShell>;
}
