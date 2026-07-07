import { AppShell } from "@/components/layout/AppShell";
import { MeasurementForm } from "@/components/measurements/MeasurementForm";
import { getLocale } from "@/lib/i18n-server";
import { text } from "@/lib/i18n";
import { HeartPulse, ShieldCheck } from "lucide-react";

export default async function NewMeasurementPage() {
  const locale = await getLocale();
  return <AppShell><div className="mx-auto max-w-4xl p-4 sm:p-5 md:p-8"><header className="measurement-page-heading mb-6 sm:mb-7"><span className="measurement-page-heading__heart"><HeartPulse/></span><div><p className="eyebrow page-eyebrow">{text(locale,"Lần đo mới","New reading")}</p><h1 className="page-heading mt-1 text-2xl font-black sm:text-3xl">{text(locale,"Ghi lại chỉ số","Record vital signs")}</h1><p className="page-subheading mt-2 text-sm leading-6 sm:text-base">{text(locale,"Nhập đúng các số hiển thị trên máy đo huyết áp.","Enter the values exactly as displayed on the blood pressure monitor.")}</p></div><span className="measurement-page-heading__safe"><ShieldCheck size={16}/>{text(locale,"Dữ liệu bảo mật","Secure data")}</span><div className="measurement-heading-ecg" aria-hidden="true"><svg viewBox="0 0 420 36" preserveAspectRatio="none"><path d="M0 20 H95 L105 20 L113 12 L122 29 L134 3 L147 33 L158 20 H260 L270 20 L278 12 L287 29 L299 3 L312 33 L323 20 H420"/></svg></div></header><MeasurementForm locale={locale}/></div></AppShell>;
}
