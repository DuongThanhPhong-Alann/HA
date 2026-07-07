import { AppShell } from "@/components/layout/AppShell";
import { MeasurementForm } from "@/components/measurements/MeasurementForm";
import { getLocale } from "@/lib/i18n-server";
import { text } from "@/lib/i18n";

export default async function NewMeasurementPage() {
  const locale = await getLocale();
  return <AppShell><div className="mx-auto max-w-4xl p-4 sm:p-5 md:p-8"><p className="eyebrow page-eyebrow">{text(locale,"Lần đo mới","New reading")}</p><h1 className="page-heading mt-1 text-2xl font-black sm:text-3xl">{text(locale,"Ghi lại chỉ số","Record vital signs")}</h1><p className="page-subheading mb-6 mt-2 text-sm leading-6 sm:mb-7 sm:text-base">{text(locale,"Nhập đúng các số hiển thị trên máy đo huyết áp.","Enter the values exactly as displayed on the blood pressure monitor.")}</p><MeasurementForm locale={locale}/></div></AppShell>;
}
