import type { BloodPressureCategory, BloodPressureSeverity } from "@/lib/blood-pressure";
export type Measurement = { id: string; user_id: string; systolic: number; diastolic: number; pulse: number; category: BloodPressureCategory; severity: BloodPressureSeverity; warning_message: string; measured_at: string; note: string | null; image_path: string | null; image_url: string | null; created_at: string; updated_at: string };
export type Profile = { id: string; full_name: string; email: string; phone: string | null; gender: string | null; birth_date: string | null };
