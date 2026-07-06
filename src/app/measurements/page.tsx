import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { MeasurementList } from "@/components/measurements/MeasurementList";
import { createClient } from "@/lib/supabase/server";
import type { Measurement } from "@/types/database";

export default async function MeasurementsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("blood_pressure_records").select("*").order("measured_at", { ascending: false });
  return <AppShell><div className="mx-auto max-w-5xl p-4 sm:p-5 md:p-8"><div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Nhật ký</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Lịch sử đo</h1></div><Link href="/measurements/new" className="btn btn-primary w-full sm:w-auto">+ Thêm lần đo</Link></div><MeasurementList initial={(data ?? []) as Measurement[]}/></div></AppShell>;
}
