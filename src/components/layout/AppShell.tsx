import Link from "next/link";
import { Activity, CirclePlus, History, LayoutDashboard, Orbit, UserRound } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const nav = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/measurements/new", label: "Thêm lần đo", icon: CirclePlus },
  { href: "/measurements", label: "Lịch sử", icon: History },
  { href: "/profile", label: "Hồ sơ", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-universe min-h-dvh w-full md:grid md:grid-cols-[250px_minmax(0,1fr)]">
    <div className="cosmic-planets" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} className={`cosmic-planet cosmic-planet--${index + 1}`} />)}</div>
    <aside className="relative hidden overflow-hidden border-r border-white/10 bg-[#12122f] p-6 text-white shadow-[12px_0_40px_rgba(31,24,83,.12)] md:flex md:flex-col">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/20 blur-2xl" />
      <Link href="/dashboard" className="relative mb-10 flex items-center gap-3 font-extrabold">
        <span className="rounded-xl border border-white/10 bg-white/10 p-2 text-cyan-200 shadow-[0_0_24px_rgba(75,210,236,.18)]"><Activity /></span>
        <span>BP Tracker</span><Orbit size={14} className="ml-auto text-violet-300" />
      </Link>
      <nav className="relative space-y-2">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-indigo-100/70 transition hover:bg-white/10 hover:text-white"><Icon size={20} />{label}</Link>)}</nav>
      <div className="relative mt-auto border-t border-white/10 pt-4 [&_button]:text-indigo-100/70 [&_button:hover]:bg-white/10 [&_button:hover]:text-white"><LogoutButton /></div>
    </aside>
    <main className="app-stage min-w-0 w-full pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-[#151432]/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_35px_rgba(30,22,83,.22)] backdrop-blur-xl md:hidden">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2.5 text-center text-[9px] leading-tight text-indigo-100/70 transition hover:text-cyan-200"><Icon className="shrink-0" size={19} /><span className="line-clamp-1 w-full">{label}</span></Link>)}<LogoutButton mobile /></nav>
  </div>;
}
