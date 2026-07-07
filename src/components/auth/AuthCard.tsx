import Link from "next/link";
import { HeartPulse, Leaf, ShieldCheck, Sprout } from "lucide-react";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <main className="auth-wellness grid min-h-screen place-items-center px-4 py-10 sm:py-14">
    <span className="auth-leaf auth-leaf--main" aria-hidden="true" />
    <span className="auth-leaf auth-leaf--small" aria-hidden="true" />
    <div className="w-full max-w-md animate-rise">
      <Link href="/" className="mb-7 flex items-center justify-center gap-3 font-extrabold text-white">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_25px_rgba(110,231,183,.2)] backdrop-blur"><HeartPulse className="text-emerald-100" /></span>
        <span>BP Tracker</span>
      </Link>
      <div className="auth-card auth-medical-card p-6 sm:p-8">
        <div className="auth-medical-ecg" aria-hidden="true"><HeartPulse size={18}/><svg viewBox="0 0 340 34" preserveAspectRatio="none"><path d="M0 19 H70 L80 19 L87 11 L95 27 L106 3 L118 31 L129 19 H210 L220 19 L227 11 L235 27 L246 3 L258 31 L269 19 H340"/></svg><span>SECURE HEALTH PORTAL</span></div>
        <div className="mb-5 flex items-center justify-between">
          <span className="eyebrow"><Sprout size={14} /> Sống xanh, sống khỏe</span>
          <Leaf className="text-emerald-500" size={22} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
        <div className="mt-7">{children}</div>
        {footer && <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">{footer}</div>}
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-medium tracking-wide text-white/65"><ShieldCheck size={13}/>DỮ LIỆU CỦA BẠN · RIÊNG TƯ · AN TOÀN</p>
    </div>
  </main>;
}
