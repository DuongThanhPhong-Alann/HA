import { CirclePlus, FileText, HeartPulse, History, LayoutDashboard, Leaf, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { IdleLogout } from "@/components/auth/IdleLogout";
import { createClient } from "@/lib/supabase/server";
import { text } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { BackgroundMusic, MusicControl, type MusicTrackId } from "./BackgroundMusic";
import { LogoutButton } from "./LogoutButton";
import { AppNavLink } from "./AppNavLink";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieLocale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileData } = user ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() : { data: null };
  const profile = profileData as { full_name?: string; avatar_preset?: string | null; avatar_path?: string | null; preferred_music?: MusicTrackId; language?: "vi" | "en" } | null;
  const locale = profile?.language ?? cookieLocale;
  const nav = [
    { href: "/dashboard", label: text(locale, "Tổng quan", "Dashboard"), icon: LayoutDashboard },
    { href: "/measurements/new", label: text(locale, "Thêm lần đo", "New reading"), icon: CirclePlus },
    { href: "/measurements", label: text(locale, "Lịch sử", "History"), icon: History },
    { href: "/reports", label: text(locale, "Báo cáo", "Reports"), icon: FileText },
    { href: "/profile", label: text(locale, "Hồ sơ", "Profile"), icon: UserRound },
  ];
  let avatarSrc: string | null = profile?.avatar_preset ? `/avatars/presets/${profile.avatar_preset}.webp` : null;

  if (!avatarSrc && profile?.avatar_path) {
    const { data: signed } = await supabase.storage.from("bp-images").createSignedUrl(profile.avatar_path, 3600);
    avatarSrc = signed?.signedUrl ?? null;
  }

  return <div className="app-wellness min-h-dvh w-full md:grid md:grid-cols-[250px_minmax(0,1fr)]">
    {user && <IdleLogout userId={user.id} locale={locale} />}
    {user && <BackgroundMusic preferredTrack={profile?.preferred_music ?? "salt_and_bamboo"} />}
    <div className="wellness-nature" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} className={`nature-leaf nature-leaf--${index + 1}`} />)}</div>
    <aside className="wellness-sidebar relative hidden overflow-visible p-6 text-white md:flex md:flex-col">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-300/15 blur-2xl" />
      <Link href="/dashboard" className="relative mb-10 flex items-center gap-3 font-extrabold">
        <span className="rounded-xl border border-white/15 bg-white/10 p-2 text-emerald-100 shadow-[0_0_24px_rgba(110,231,183,.2)]"><HeartPulse /></span>
        <span>BP Tracker</span><Leaf size={16} className="ml-auto text-emerald-200" />
      </Link>
      <nav className="relative space-y-2">{nav.map(({ href, label, icon: Icon }) => <AppNavLink key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-emerald-50/75 transition hover:bg-white/10 hover:text-white"><Icon size={20} />{label}</AppNavLink>)}</nav>
      <div className="relative mt-auto border-t border-white/10 pt-4">
        <Link href="/profile" className="mb-2 flex min-w-0 items-center gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">{avatarSrc ? <Image src={avatarSrc} alt="Avatar" fill unoptimized className="object-cover" sizes="40px" /> : <UserRound size={19} />}</span>
          <span className="min-w-0"><b className="block truncate text-xs">{profile?.full_name || text(locale, "Hồ sơ của tôi", "My profile")}</b><small className="block truncate text-[10px] text-emerald-50/50">{user?.email}</small></span>
        </Link>
        <div className="space-y-1 [&_button]:text-emerald-50/70 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">{user && <MusicControl userId={user.id} locale={locale}/>}<LogoutButton locale={locale} /></div>
      </div>
    </aside>
    <main className="app-stage min-w-0 w-full pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">{children}</main>
    <nav className="wellness-mobile-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">{nav.map(({ href, label, icon: Icon }) => <AppNavLink key={href} href={href} className="flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2.5 text-center text-[9px] leading-tight text-emerald-50/75 transition hover:text-white">{href === "/profile" && avatarSrc ? <span className="relative h-[19px] w-[19px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/30"><Image src={avatarSrc} alt="" fill unoptimized className="object-cover" sizes="19px" /></span> : <Icon className="shrink-0" size={19} />}<span className="line-clamp-1 w-full">{label}</span></AppNavLink>)}{user && <MusicControl userId={user.id} locale={locale} mobile/>}<LogoutButton mobile locale={locale} /></nav>
  </div>;
}
