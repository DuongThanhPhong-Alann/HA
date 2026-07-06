import { AppShell } from "@/components/layout/AppShell";
import { MeasurementForm } from "@/components/measurements/MeasurementForm";

export default function NewMeasurementPage() {
  return <AppShell><div className="mx-auto max-w-4xl p-4 sm:p-5 md:p-8"><p className="eyebrow page-eyebrow">Lần đo mới</p><h1 className="page-heading mt-1 text-2xl font-black sm:text-3xl">Ghi lại chỉ số</h1><p className="page-subheading mb-6 mt-2 text-sm leading-6 sm:mb-7 sm:text-base">Nhập đúng các số hiển thị trên máy đo huyết áp.</p><MeasurementForm/></div></AppShell>;
}
