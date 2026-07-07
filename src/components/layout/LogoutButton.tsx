"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { text, type AppLocale } from "@/lib/i18n";

export function LogoutButton({ mobile = false, locale = "vi" }: { mobile?: boolean; locale?: AppLocale }) {
  const router = useRouter();

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (mobile) {
    return <button type="button" className="flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2.5 text-center text-[9px] leading-tight text-indigo-100/70 transition hover:text-red-300" onClick={logout}>
      <LogOut className="shrink-0" size={19} />
      <span className="line-clamp-1 w-full">{text(locale, "Đăng xuất", "Sign out")}</span>
    </button>;
  }

  return <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-slate-600 hover:bg-red-50 hover:text-red-700" onClick={logout}>
    <LogOut size={20} />{text(locale, "Đăng xuất", "Sign out")}
  </button>;
}
