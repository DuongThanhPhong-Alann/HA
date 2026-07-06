import Link from "next/link";
import { Activity, Orbit, Sparkles } from "lucide-react";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <main className="auth-universe grid min-h-screen place-items-center px-4 py-10 sm:py-14">
    <span className="auth-orb auth-orb--main" aria-hidden="true" />
    <span className="auth-orb auth-orb--small" aria-hidden="true" />
    <div className="w-full max-w-md animate-rise">
      <Link href="/" className="mb-7 flex items-center justify-center gap-3 font-extrabold text-white">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_25px_rgba(84,215,239,.2)] backdrop-blur"><Activity className="text-cyan-200" /></span>
        <span>BP Tracker</span>
      </Link>
      <div className="auth-card p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <span className="eyebrow"><Sparkles size={14} /> Không gian sức khỏe</span>
          <Orbit className="text-violet-400" size={22} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
        <div className="mt-7">{children}</div>
        {footer && <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">{footer}</div>}
      </div>
      <p className="mt-5 text-center text-[11px] font-medium tracking-wide text-white/45">DỮ LIỆU CỦA BẠN · RIÊNG TƯ · AN TOÀN</p>
    </div>
  </main>;
}
