"use client";

import { BellRing, Camera, Check, Images, Save, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

const avatarPresets = Array.from({ length: 60 }, (_, index) => `avatar-${String(index + 1).padStart(2, "0")}`);
const presetUrl = (preset: string) => `/avatars/presets/${preset}.webp`;

export function ProfileForm({ profile, avatarUrl, user }: { profile: Profile | null; avatarUrl: string | null; user: { id: string; email?: string } }) {
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarPreset, setAvatarPreset] = useState<string | null>(profile?.avatar_preset ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(profile?.avatar_path ? avatarUrl : null);
  const currentAvatar = avatarPreset ? presetUrl(avatarPreset) : customPreview;

  useEffect(() => () => {
    if (customPreview?.startsWith("blob:")) URL.revokeObjectURL(customPreview);
  }, [customPreview]);

  const choosePreset = (preset: string) => {
    setAvatarPreset(preset);
    setAvatarFile(null);
    setCustomPreview(null);
    setPickerOpen(false);
  };

  const chooseUpload = (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Avatar phải là JPG, PNG hoặc WEBP");
    if (file.size > 5 * 1024 * 1024) return toast.error("Avatar không được vượt quá 5MB");
    setAvatarFile(file);
    setAvatarPreset(null);
    setCustomPreview(URL.createObjectURL(file));
  };

  return <form className="card form-panel overflow-hidden" onSubmit={async (event) => {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const oldAvatarPath = profile?.avatar_path ?? null;
    let nextAvatarPath = oldAvatarPath;
    let uploadedPath: string | null = null;

    if (avatarFile) {
      const extension = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
      uploadedPath = `${user.id}/avatars/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("bp-images").upload(uploadedPath, avatarFile, { contentType: avatarFile.type });
      if (uploadError) {
        setBusy(false);
        return toast.error(`Không thể tải avatar: ${uploadError.message}`);
      }
      nextAvatarPath = uploadedPath;
    } else if (avatarPreset) {
      nextAvatarPath = null;
    }

    const basicProfile = { id: user.id, email: user.email, full_name: form.get("full_name"), phone: form.get("phone") || null, gender: form.get("gender") || null, birth_date: form.get("birth_date") || null, updated_at: new Date().toISOString() };
    let { error } = await supabase.from("profiles").upsert({ ...basicProfile, weekly_report_enabled: form.get("weekly_report_enabled") === "on", monthly_report_enabled: form.get("monthly_report_enabled") === "on", report_timezone: "Asia/Ho_Chi_Minh", avatar_preset: avatarPreset, avatar_path: nextAvatarPath });
    let savedBasicOnly = false;

    if (error && /Could not find the '(weekly_report_enabled|monthly_report_enabled|report_timezone|avatar_preset|avatar_path)' column/i.test(error.message)) {
      ({ error } = await supabase.from("profiles").upsert(basicProfile));
      savedBasicOnly = !error;
    }

    if (error || savedBasicOnly) {
      if (uploadedPath) await supabase.storage.from("bp-images").remove([uploadedPath]);
    } else if (oldAvatarPath && oldAvatarPath !== nextAvatarPath) {
      await supabase.storage.from("bp-images").remove([oldAvatarPath]);
    }

    setBusy(false);
    if (error) toast.error(error.message);
    else if (savedBasicOnly) toast.warning("Đã lưu thông tin cơ bản. Hãy chạy migration avatar và báo cáo trên Supabase.");
    else toast.success("Đã cập nhật hồ sơ và avatar");
  }}>
    <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-5 sm:p-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-xl shadow-violet-200/70">
          {currentAvatar ? <Image src={currentAvatar} alt="Avatar hiện tại" fill unoptimized className="object-cover" sizes="80px" /> : <UserRound size={34} />}
        </span>
        <div className="min-w-0 flex-1"><h2 className="font-extrabold">Ảnh đại diện</h2><p className="mt-1 text-xs leading-5 text-slate-500">Chọn icon neon hoặc tải ảnh của bạn.</p></div>
        <ShieldCheck className="hidden shrink-0 text-violet-400 sm:block" size={22} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" className="btn btn-outline min-w-0 px-2 text-xs sm:text-sm" onClick={() => setPickerOpen((open) => !open)}><Images size={17} />Chọn icon</button>
        <label className="btn btn-outline min-w-0 cursor-pointer px-2 text-xs sm:text-sm"><Camera size={17} />Tải ảnh lên<input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => chooseUpload(event.target.files?.[0] ?? null)} /></label>
      </div>
      {pickerOpen && <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-inner">
        <div className="grid grid-cols-5 gap-2 min-[420px]:grid-cols-6 sm:grid-cols-8">{avatarPresets.map((preset) => <button key={preset} type="button" aria-label={`Chọn ${preset}`} className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-black transition hover:scale-105 ${avatarPreset === preset ? "border-violet-600 shadow-[0_0_0_3px_rgba(124,79,239,.16)]" : "border-transparent"}`} onClick={() => choosePreset(preset)}><Image src={presetUrl(preset)} alt="" fill unoptimized loading="lazy" className="object-cover" sizes="72px" />{avatarPreset === preset && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-white"><Check size={13} /></span>}</button>)}</div>
      </div>}
    </div>

    <div className="space-y-7 p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold">Họ và tên<input name="full_name" required className="input mt-2" defaultValue={profile?.full_name || ""} /></label>
        <label className="text-sm font-bold">Email nhận báo cáo<input disabled className="input mt-2" value={user.email || ""} /></label>
        <label className="text-sm font-bold">Số điện thoại<input name="phone" className="input mt-2" defaultValue={profile?.phone || ""} /></label>
        <label className="text-sm font-bold">Giới tính<select name="gender" className="input mt-2" defaultValue={profile?.gender || ""}><option value="">Không cung cấp</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></label>
        <label className="text-sm font-bold">Ngày sinh<input name="birth_date" type="date" className="input mt-2" defaultValue={profile?.birth_date || ""} /></label>
      </div>
      <fieldset className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-cyan-50/60 p-4 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-violet-900"><span className="inline-flex items-center gap-2"><BellRing size={16} />Báo cáo sức khỏe tự động</span></legend>
        <p className="mb-4 text-xs leading-5 text-slate-600">Báo cáo được gửi lúc 08:00 sáng theo giờ Việt Nam, sau khi tuần hoặc tháng kết thúc.</p>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span><b className="block text-sm">Báo cáo mỗi tuần</b><small className="text-slate-500">Gửi vào sáng thứ Hai</small></span><input name="weekly_report_enabled" type="checkbox" className="h-5 w-5 accent-violet-700" defaultChecked={profile?.weekly_report_enabled ?? true} /></label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span><b className="block text-sm">Báo cáo mỗi tháng</b><small className="text-slate-500">Gửi vào sáng ngày 1 tháng kế tiếp</small></span><input name="monthly_report_enabled" type="checkbox" className="h-5 w-5 accent-violet-700" defaultChecked={profile?.monthly_report_enabled ?? true} /></label>
        </div>
      </fieldset>
      <button disabled={busy} className="btn btn-primary w-full sm:w-auto"><Save size={18} />{busy ? "Đang lưu..." : "Lưu thay đổi"}</button>
    </div>
  </form>;
}
