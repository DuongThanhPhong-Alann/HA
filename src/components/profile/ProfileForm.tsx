"use client";

import { BellRing, Save, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import type { Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ProfileForm({ profile, user }: { profile: Profile | null; user: { id: string; email?: string } }) {
  const [busy, setBusy] = useState(false);
  return <form className="card form-panel overflow-hidden" onSubmit={async (event) => {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const basicProfile = { id: user.id, email: user.email, full_name: form.get("full_name"), phone: form.get("phone") || null, gender: form.get("gender") || null, birth_date: form.get("birth_date") || null, updated_at: new Date().toISOString() };
    let { error } = await supabase.from("profiles").upsert({ ...basicProfile, weekly_report_enabled: form.get("weekly_report_enabled") === "on", monthly_report_enabled: form.get("monthly_report_enabled") === "on", report_timezone: "Asia/Ho_Chi_Minh" });
    let savedBasicOnly = false;
    if (error && /Could not find the '(weekly_report_enabled|monthly_report_enabled|report_timezone)' column/i.test(error.message)) {
      ({ error } = await supabase.from("profiles").upsert(basicProfile));
      savedBasicOnly = !error;
    }
    setBusy(false);
    if (error) toast.error(error.message);
    else if (savedBasicOnly) toast.warning("Đã lưu thông tin cơ bản. Database cần cập nhật để lưu cài đặt báo cáo.");
    else toast.success("Đã cập nhật hồ sơ");
  }}>
    <div className="flex items-center gap-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-5 sm:p-6">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-200"><UserRound size={23} /></span>
      <div><h2 className="font-extrabold">Thông tin định danh</h2><p className="mt-1 text-xs leading-5 text-slate-500">Thông tin được bảo vệ và chỉ dùng cho hồ sơ sức khỏe.</p></div>
      <ShieldCheck className="ml-auto hidden text-violet-400 sm:block" size={22} />
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
