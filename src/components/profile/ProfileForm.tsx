"use client";

import { AudioLines, BellRing, Camera, Check, HeartPulse, Images, Languages, Music2, Save, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { persistLocale, text, type AppLocale } from "@/lib/i18n";
import { MUSIC_TRACKS, persistMusicPreference, type MusicTrackId } from "@/components/layout/BackgroundMusic";
import type { Profile } from "@/types/database";

const avatarPresets = Array.from({ length: 60 }, (_, index) => `avatar-${String(index + 1).padStart(2, "0")}`);
const presetUrl = (preset: string) => `/avatars/presets/${preset}.webp`;

export function ProfileForm({ profile, avatarUrl, user, initialLocale = "vi" }: { profile: Profile | null; avatarUrl: string | null; user: { id: string; email?: string }; initialLocale?: AppLocale }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarPreset, setAvatarPreset] = useState<string | null>(profile?.avatar_preset ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(profile?.avatar_path ? avatarUrl : null);
  const [language, setLanguage] = useState<AppLocale>(profile?.language ?? initialLocale);
  const [preferredMusic, setPreferredMusic] = useState<MusicTrackId>(profile?.preferred_music ?? "salt_and_bamboo");
  const currentAvatar = avatarPreset ? presetUrl(avatarPreset) : customPreview;
  const tx = (vi: string, en: string) => text(language, vi, en);

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

  const changeMusic = async (next: MusicTrackId) => {
    setPreferredMusic(next);
    persistMusicPreference(next);
    const { error } = await createClient().from("profiles").update({ preferred_music: next }).eq("id", user.id);
    if (error) toast.warning(tx("Đã đổi nhạc trên thiết bị này; cần chạy migration để đồng bộ tài khoản.", "Music changed on this device; apply the migration for account sync."));
    else toast.success(tx("Đã đổi bài nhạc", "Music changed"));
  };

  const changeLanguage = async (next: AppLocale) => {
    setLanguage(next);
    persistLocale(next);
    const { error } = await createClient().from("profiles").update({ language: next }).eq("id", user.id);
    if (error) toast.warning(text(next,"Đã đổi ngôn ngữ trên thiết bị này; cần chạy migration để đồng bộ tài khoản.","Language changed on this device; apply the migration for account sync."));
    else toast.success(text(next,"Đã đổi ngôn ngữ","Language changed"));
    router.refresh();
  };

  return <div className="space-y-5"><form className="card form-panel profile-medical-card overflow-hidden" onSubmit={async (event) => {
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
    else {
      if (savedBasicOnly) toast.warning(tx("Đã lưu thông tin cơ bản. Hãy chạy migration hồ sơ trên Supabase.", "Basic profile saved. Apply the profile migration in Supabase."));
      else toast.success(tx("Đã cập nhật hồ sơ", "Profile updated"));
      router.refresh();
    }
  }}>
    <div className="profile-medical-cover border-b border-violet-100 p-5 sm:p-6">
      <div className="profile-ecg" aria-hidden="true"><svg viewBox="0 0 500 42" preserveAspectRatio="none"><path d="M0 23 H110 L124 23 L132 14 L142 32 L155 3 L169 36 L180 23 H300 L314 23 L322 14 L332 32 L345 3 L359 36 L370 23 H500"/></svg></div>
      <div className="flex min-w-0 items-center gap-4">
        <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-xl shadow-violet-200/70">
          {currentAvatar ? <Image src={currentAvatar} alt="Avatar hiện tại" fill unoptimized className="object-cover" sizes="80px" /> : <UserRound size={34} />}
        </span>
        <div className="min-w-0 flex-1"><h2 className="font-extrabold">{tx("Ảnh đại diện", "Profile picture")}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{tx("Chọn icon neon hoặc tải ảnh của bạn.", "Choose a preset or upload your own image.")}</p></div>
        <ShieldCheck className="hidden shrink-0 text-violet-400 sm:block" size={22} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" className="btn btn-outline min-w-0 px-2 text-xs sm:text-sm" onClick={() => setPickerOpen((open) => !open)}><Images size={17} />{tx("Chọn icon", "Choose preset")}</button>
        <label className="btn btn-outline min-w-0 cursor-pointer px-2 text-xs sm:text-sm"><Camera size={17} />{tx("Tải ảnh lên", "Upload image")}<input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => chooseUpload(event.target.files?.[0] ?? null)} /></label>
      </div>
      {pickerOpen && <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-inner">
        <div className="grid grid-cols-5 gap-2 min-[420px]:grid-cols-6 sm:grid-cols-8">{avatarPresets.map((preset) => <button key={preset} type="button" aria-label={`Chọn ${preset}`} className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-black transition hover:scale-105 ${avatarPreset === preset ? "border-violet-600 shadow-[0_0_0_3px_rgba(124,79,239,.16)]" : "border-transparent"}`} onClick={() => choosePreset(preset)}><Image src={presetUrl(preset)} alt="" fill unoptimized loading="lazy" className="object-cover" sizes="72px" />{avatarPreset === preset && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-white"><Check size={13} /></span>}</button>)}</div>
      </div>}
    </div>

    <div className="space-y-7 p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold">{tx("Họ và tên", "Full name")}<input name="full_name" required className="input mt-2" defaultValue={profile?.full_name || ""} /></label>
        <label className="text-sm font-bold">{tx("Email nhận báo cáo", "Report email")}<input disabled className="input mt-2" value={user.email || ""} /></label>
        <label className="text-sm font-bold">{tx("Số điện thoại", "Phone number")}<input name="phone" className="input mt-2" defaultValue={profile?.phone || ""} /></label>
        <label className="text-sm font-bold">{tx("Giới tính", "Sex")}<select name="gender" className="input mt-2" defaultValue={profile?.gender || ""}><option value="">{tx("Không cung cấp", "Prefer not to say")}</option><option value="male">{tx("Nam", "Male")}</option><option value="female">{tx("Nữ", "Female")}</option><option value="other">{tx("Khác", "Other")}</option></select></label>
        <label className="text-sm font-bold">{tx("Ngày sinh", "Date of birth")}<input name="birth_date" type="date" className="input mt-2" defaultValue={profile?.birth_date || ""} /></label>
      </div>
      <fieldset className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-cyan-50/60 p-4 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-violet-900"><span className="inline-flex items-center gap-2"><BellRing size={16} />{tx("Báo cáo sức khỏe tự động", "Automated health reports")}</span></legend>
        <p className="mb-4 text-xs leading-5 text-slate-600">{tx("Báo cáo được gửi lúc 08:00 sáng theo giờ Việt Nam, sau khi tuần hoặc tháng kết thúc.", "Reports are delivered at 08:00 Vietnam time after each week or month ends.")}</p>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span><b className="block text-sm">{tx("Báo cáo mỗi tuần", "Weekly report")}</b><small className="text-slate-500">{tx("Gửi vào sáng thứ Hai", "Delivered Monday morning")}</small></span><input name="weekly_report_enabled" type="checkbox" className="h-5 w-5 accent-violet-700" defaultChecked={profile?.weekly_report_enabled ?? true} /></label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span><b className="block text-sm">{tx("Báo cáo mỗi tháng", "Monthly report")}</b><small className="text-slate-500">{tx("Gửi vào sáng ngày 1 tháng kế tiếp", "Delivered on the first day of the next month")}</small></span><input name="monthly_report_enabled" type="checkbox" className="h-5 w-5 accent-violet-700" defaultChecked={profile?.monthly_report_enabled ?? true} /></label>
        </div>
      </fieldset>
      <button disabled={busy} className="btn btn-primary w-full sm:w-auto"><Save size={18} />{busy ? tx("Đang lưu...", "Saving...") : tx("Lưu thay đổi", "Save changes")}</button>
    </div>
  </form>
  <section className="card preference-console overflow-hidden">
    <div className="preference-console__head">
      <span className="preference-console__heart"><HeartPulse size={21}/></span>
      <div><p className="eyebrow">{tx("TRẠM CÁ NHÂN HÓA", "PERSONALIZATION STATION")}</p><h2 className="mt-1 font-black">{tx("Ngôn ngữ và liệu pháp âm thanh", "Language and ambient sound")}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{tx("Mọi thay đổi được áp dụng ngay, không cần nhấn lưu.", "Changes take effect immediately; no save action is required.")}</p></div>
      <AudioLines className="ml-auto hidden text-violet-400 sm:block" size={28}/>
    </div>
    <div className="preference-wave" aria-hidden="true">{Array.from({length:24},(_,index)=><i key={index} style={{animationDelay:`-${index * 70}ms`}}/>)}</div>
    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
      <label className="preference-option"><span className="preference-option__icon preference-option__icon--language"><Languages size={20}/></span><span className="min-w-0 flex-1"><b className="block text-sm">{tx("Ngôn ngữ y khoa", "Clinical language")}</b><small className="text-slate-500">{tx("Thuật ngữ chuyên môn nhất quán", "Consistent professional terminology")}</small></span><select aria-label={tx("Ngôn ngữ","Language")} value={language} onChange={(event) => void changeLanguage(event.target.value as AppLocale)}><option value="vi">Tiếng Việt</option><option value="en">English · Clinical</option></select></label>
      <label className="preference-option"><span className="preference-option__icon preference-option__icon--music"><Music2 size={20}/></span><span className="min-w-0 flex-1"><b className="block text-sm">{tx("Âm nhạc thư giãn", "Ambient music")}</b><small className="text-slate-500">{tx("Đổi bài và phát ngay lập tức", "Switch and play immediately")}</small></span><select aria-label={tx("Bài nhạc","Music track")} value={preferredMusic} onChange={(event) => void changeMusic(event.target.value as MusicTrackId)}>{MUSIC_TRACKS.map((track)=><option key={track.id} value={track.id}>{track.title}</option>)}</select></label>
    </div>
  </section></div>;
}
