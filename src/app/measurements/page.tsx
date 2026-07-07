import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { MeasurementList } from "@/components/measurements/MeasurementList";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n-server";
import { text } from "@/lib/i18n";
import type { Measurement } from "@/types/database";

export default async function MeasurementsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("blood_pressure_records").select("*").order("measured_at", { ascending: false });
  return <AppShell><div className="mx-auto max-w-5xl p-4 sm:p-5 md:p-8"><div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow page-eyebrow">{text(locale,"Nhật ký","Clinical log")}</p><h1 className="page-heading mt-1 text-2xl font-black sm:text-3xl">{text(locale,"Lịch sử đo","Measurement history")}</h1></div><Link href="/measurements/new" className="btn btn-primary w-full sm:w-auto">+ {text(locale,"Thêm lần đo","Add reading")}</Link></div><MeasurementList initial={(data ?? []) as Measurement[]} locale={locale}/></div></AppShell>;
}
