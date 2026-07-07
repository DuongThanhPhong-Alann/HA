import { Activity, CirclePlus, History, LayoutDashboard, Orbit, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { IdleLogout } from "@/components/auth/IdleLogout";
import { createClient } from "@/lib/supabase/server";
import { text } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { BackgroundMusic, type MusicTrackId } from "./BackgroundMusic";
import { LogoutButton } from "./LogoutButton";

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
    { href: "/profile", label: text(locale, "Hồ sơ", "Profile"), icon: UserRound },
  ];
  let avatarSrc: string | null = profile?.avatar_preset ? `/avatars/presets/${profile.avatar_preset}.webp` : null;

  if (!avatarSrc && profile?.avatar_path) {
    const { data: signed } = await supabase.storage.from("bp-images").createSignedUrl(profile.avatar_path, 3600);
    avatarSrc = signed?.signedUrl ?? null;
  }

  return <div className="app-universe min-h-dvh w-full md:grid md:grid-cols-[250px_minmax(0,1fr)]">
    {user && <IdleLogout userId={user.id} locale={locale} />}
    {user && <BackgroundMusic preferredTrack={profile?.preferred_music ?? "salt_and_bamboo"} />}
    <div className="cosmic-planets" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} className={`cosmic-planet cosmic-planet--${index + 1}`} />)}</div>
    <aside className="relative hidden overflow-hidden border-r border-white/10 bg-[#12122f] p-6 text-white shadow-[12px_0_40px_rgba(31,24,83,.12)] md:flex md:flex-col">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/20 blur-2xl" />
      <Link href="/dashboard" className="relative mb-10 flex items-center gap-3 font-extrabold">
        <span className="rounded-xl border border-white/10 bg-white/10 p-2 text-cyan-200 shadow-[0_0_24px_rgba(75,210,236,.18)]"><Activity /></span>
        <span>BP Tracker</span><Orbit size={14} className="ml-auto text-violet-300" />
      </Link>
      <nav className="relative space-y-2">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-indigo-100/70 transition hover:bg-white/10 hover:text-white"><Icon size={20} />{label}</Link>)}</nav>
      <div className="relative mt-auto border-t border-white/10 pt-4">
        <Link href="/profile" className="mb-2 flex min-w-0 items-center gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">{avatarSrc ? <Image src={avatarSrc} alt="Avatar" fill unoptimized className="object-cover" sizes="40px" /> : <UserRound size={19} />}</span>
          <span className="min-w-0"><b className="block truncate text-xs">{profile?.full_name || text(locale, "Hồ sơ của tôi", "My profile")}</b><small className="block truncate text-[10px] text-indigo-100/50">{user?.email}</small></span>
        </Link>
        <div className="[&_button]:text-indigo-100/70 [&_button:hover]:bg-white/10 [&_button:hover]:text-white"><LogoutButton locale={locale} /></div>
      </div>
    </aside>
    <main className="app-stage min-w-0 w-full pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-[#151432]/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_35px_rgba(30,22,83,.22)] backdrop-blur-xl md:hidden">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2.5 text-center text-[9px] leading-tight text-indigo-100/70 transition hover:text-cyan-200">{href === "/profile" && avatarSrc ? <span className="relative h-[19px] w-[19px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/30"><Image src={avatarSrc} alt="" fill unoptimized className="object-cover" sizes="19px" /></span> : <Icon className="shrink-0" size={19} />}<span className="line-clamp-1 w-full">{label}</span></Link>)}<LogoutButton mobile locale={locale} /></nav>
  </div>;
}
