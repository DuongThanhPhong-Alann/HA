"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, ImagePlus, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { categoryLabelsEnglish, classifyBloodPressure, medicalMessagesEnglish } from "@/lib/blood-pressure";
import { text, type AppLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { bloodPressureSchema } from "@/lib/validations";

type FormValues = z.input<typeof bloodPressureSchema>;

export function MeasurementForm({ locale = "vi" }: { locale?: AppLocale }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(bloodPressureSchema),
    defaultValues: { measured_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), note: "" },
  });
  const values = watch();
  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const selectImage = (nextFile: File | null) => {
    if (!nextFile) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
      toast.error("Ảnh phải là JPG, PNG hoặc WEBP");
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }
    setFile(nextFile);
    setImagePreview(URL.createObjectURL(nextFile));
  };

  const removeImage = () => {
    setFile(null);
    setImagePreview(null);
  };

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
    toast.success(text(locale,"Đã lưu kết quả","Reading saved"));
    router.push(`/measurements/${data.id}`);
    router.refresh();
  })}>
    <div className="grid grid-cols-3 gap-2 sm:gap-4">{[["systolic","SYS",text(locale,"Tâm thu","Systolic"),"120"],["diastolic","DIA",text(locale,"Tâm trương","Diastolic"),"80"],["pulse","PULSE",text(locale,"Nhịp tim","Pulse rate"),"72"]].map(([name, short, label, placeholder]) => <label key={name} className="card measurement-tile block min-w-0 p-3 text-center text-sm font-bold sm:p-4 sm:pl-5 sm:text-left"><span className="block text-violet-700 sm:inline">{short}</span><span className="mt-0.5 block truncate text-[10px] text-slate-400 sm:ml-2 sm:mt-0 sm:inline sm:text-sm">{label}</span><input className="mt-1.5 w-full min-w-0 border-0 bg-transparent text-center text-3xl font-black tracking-tight text-slate-900 outline-none placeholder:text-slate-200 sm:mt-3 sm:text-left sm:text-4xl" inputMode="numeric" placeholder={placeholder} {...register(name as "systolic")}/><span className="block truncate text-[9px] font-normal text-slate-400 sm:text-xs">{name === "pulse" ? text(locale,"lần / phút","beats / min") : "mmHg"}</span><small className="block break-words text-[9px] leading-4 text-red-600 sm:text-xs sm:leading-5">{errors[name as keyof typeof errors]?.message}</small></label>)}</div>
    {preview && <div className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${preview.severity === "emergency" ? "border-red-500 bg-red-700 text-white shadow-red-900/20" : "border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50 text-slate-900"}`}><b className="text-base">{locale==="en"?categoryLabelsEnglish[preview.category]:preview.title}</b><p className="mt-2 text-sm leading-6 opacity-80">{locale==="en"?medicalMessagesEnglish[preview.category]:preview.message}</p></div>}
    <div className="card form-panel min-w-0 space-y-5 p-4 sm:p-6"><div className="flex min-w-0 items-center gap-3 border-b border-slate-100 pb-4"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(124,79,239,.7)]"/><div className="min-w-0"><b className="block text-sm">{text(locale,"Thông tin lần đo","Reading details")}</b><span className="block text-xs leading-5 text-slate-400">{text(locale,"Bổ sung ngữ cảnh để theo dõi chính xác hơn","Add clinical context for more accurate longitudinal monitoring")}</span></div></div><label className="block min-w-0 text-sm font-bold">{text(locale,"Thời gian đo","Measurement time")}<input className="input mt-2 min-w-0" type="datetime-local" {...register("measured_at")}/><small className="text-red-600">{errors.measured_at?.message}</small></label><label className="block min-w-0 text-sm font-bold">{text(locale,"Ghi chú","Clinical note")}<textarea className="input mt-2 min-h-24 resize-y" placeholder={text(locale,"Ví dụ: đo sau khi nghỉ 10 phút...","Example: measured after 10 minutes of seated rest...")} {...register("note")}/><small className="text-red-600">{errors.note?.message}</small></label><div className="min-w-0 text-sm font-bold">{text(locale,"Ảnh máy đo (không bắt buộc)","Monitor image (optional)")}{imagePreview && <div className="mt-3 overflow-hidden rounded-2xl border border-violet-100 bg-slate-950 shadow-lg"><div className="relative aspect-[4/3] w-full"><Image src={imagePreview} alt={text(locale,"Ảnh máy đo vừa chọn","Selected monitor image")} fill unoptimized className="object-contain" sizes="(max-width: 768px) 100vw, 768px"/></div><div className="flex min-w-0 items-center justify-between gap-3 bg-white px-3 py-3 sm:px-4"><span className="min-w-0 truncate text-xs font-bold text-slate-600">{file?.name}</span><button type="button" className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-extrabold text-red-600" onClick={removeImage}>{text(locale,"Bỏ ảnh","Remove")}</button></div></div>}<div className="mt-3 grid gap-3 md:grid-cols-2"><label className="upload-zone flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-violet-300 bg-violet-50/70 p-3 text-violet-800 sm:p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm"><Camera size={20}/></span><span className="min-w-0"><b className="block text-sm">{file ? text(locale,"Chụp ảnh khác","Retake photo") : text(locale,"Chụp bằng camera","Use camera")}</b><small className="block truncate font-normal text-violet-600/70">{text(locale,"Ưu tiên camera sau","Rear camera recommended")}</small></span><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => selectImage(event.target.files?.[0] || null)}/></label><label className="upload-zone flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-violet-300 bg-violet-50/70 p-3 text-violet-800 sm:p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm"><ImagePlus size={20}/></span><span className="min-w-0"><b className="block text-sm">{file ? text(locale,"Chọn ảnh khác","Choose another image") : text(locale,"Chọn từ thư viện","Choose from library")}</b><small className="block truncate font-normal text-violet-600/70">JPG, PNG, WEBP · {text(locale,"tối đa 5MB","max. 5 MB")}</small></span><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => selectImage(event.target.files?.[0] || null)}/></label></div></div></div>
    <button disabled={isSubmitting} className="btn btn-primary w-full sm:w-auto"><Save size={18}/>{isSubmitting ? text(locale,"Đang lưu...","Saving...") : text(locale,"Lưu kết quả","Save reading")}</button>
  </form>;
}
