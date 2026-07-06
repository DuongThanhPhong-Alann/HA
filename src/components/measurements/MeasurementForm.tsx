"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { classifyBloodPressure } from "@/lib/blood-pressure";
import { createClient } from "@/lib/supabase/client";
import { bloodPressureSchema } from "@/lib/validations";

type FormValues = z.input<typeof bloodPressureSchema>;

export function MeasurementForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(bloodPressureSchema),
    defaultValues: { measured_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), note: "" },
  });
  const values = watch();
  let preview = null;
  try {
    if (values.systolic && values.diastolic && values.pulse) preview = classifyBloodPressure(Number(values.systolic), Number(values.diastolic), Number(values.pulse));
  } catch {}

  return <form className="min-w-0 space-y-5 sm:space-y-6" onSubmit={handleSubmit(async (raw) => {
    const value = bloodPressureSchema.parse(raw);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Phiên đăng nhập đã hết hạn");
    if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) return toast.error("Ảnh phải là JPG, PNG, WEBP và không quá 5MB");
    const result = classifyBloodPressure(value.systolic, value.diastolic, value.pulse);
    const id = crypto.randomUUID();
    let image_path: string | null = null;
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      image_path = `${user.id}/${id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("bp-images").upload(image_path, file);
      if (error) return toast.error(`Không thể tải ảnh: ${error.message}`);
    }
    const { data, error } = await supabase.from("blood_pressure_records").insert({ id, user_id: user.id, systolic: value.systolic, diastolic: value.diastolic, pulse: value.pulse, category: result.category, severity: result.severity, warning_message: result.message, measured_at: new Date(value.measured_at).toISOString(), note: value.note || null, image_path }).select("id").single();
    if (error) {
      if (image_path) await supabase.storage.from("bp-images").remove([image_path]);
      return toast.error(error.message);
    }
    toast.success("Đã lưu kết quả");
    router.push(`/measurements/${data.id}`);
    router.refresh();
  })}>
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">{[["systolic","SYS","Tâm thu","120"],["diastolic","DIA","Tâm trương","80"],["pulse","PULSE","Nhịp tim","72"]].map(([name, short, label, placeholder]) => <label key={name} className="card block min-w-0 p-4 text-sm font-bold"><span className="text-cyan-800">{short}</span><span className="ml-2 text-slate-400">{label}</span><input className="mt-2 w-full min-w-0 border-0 bg-transparent text-4xl font-black outline-none sm:mt-3" inputMode="numeric" placeholder={placeholder} {...register(name as "systolic")}/><span className="text-xs font-normal text-slate-400">{name === "pulse" ? "lần / phút" : "mmHg"}</span><small className="block leading-5 text-red-600">{errors[name as keyof typeof errors]?.message}</small></label>)}</div>
    {preview && <div className={`rounded-2xl p-4 sm:p-5 ${preview.severity === "emergency" ? "bg-red-700 text-white" : "bg-cyan-50 text-cyan-950"}`}><b>{preview.title}</b><p className="mt-2 text-sm leading-6">{preview.message}</p></div>}
    <div className="card min-w-0 space-y-4 p-4 sm:p-5"><label className="block text-sm font-bold">Thời gian đo<input className="input mt-2 min-w-0" type="datetime-local" {...register("measured_at")}/><small className="text-red-600">{errors.measured_at?.message}</small></label><label className="block text-sm font-bold">Ghi chú<textarea className="input mt-2 min-h-24 resize-y" placeholder="Ví dụ: đo sau khi nghỉ 10 phút..." {...register("note")}/><small className="text-red-600">{errors.note?.message}</small></label><label className="block min-w-0 text-sm font-bold">Ảnh máy đo (không bắt buộc)<span className="mt-2 flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-300 bg-cyan-50 p-3 text-cyan-800 sm:p-4"><Camera className="shrink-0"/><span className="min-w-0 break-words text-sm">{file ? file.name : "Chọn ảnh JPG, PNG hoặc WEBP — tối đa 5MB"}</span><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)}/></span></label></div>
    <button disabled={isSubmitting} className="btn btn-primary w-full sm:w-auto"><Save size={18}/>{isSubmitting ? "Đang lưu..." : "Lưu kết quả"}</button>
  </form>;
}
