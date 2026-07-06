import { Activity, ArrowRight, BarChart3, Camera, LockKeyhole, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: Activity, title: "Lưu lịch sử chỉ số", text: "Ghi lại SYS, DIA, nhịp tim và thời gian đo." },
  { icon: ShieldCheck, title: "Phân loại tức thì", text: "Nhận cảnh báo tham khảo rõ ràng sau mỗi lần đo." },
  { icon: Camera, title: "Lưu ảnh máy đo", text: "Đính kèm ảnh để đối chiếu khi cần." },
  { icon: BarChart3, title: "Theo dõi xu hướng", text: "Quan sát thay đổi chỉ số theo thời gian." },
  { icon: LockKeyhole, title: "Dữ liệu riêng tư", text: "Mỗi tài khoản chỉ truy cập dữ liệu của chính mình." },
];

export default function Home() {
  return <div className="min-h-screen bg-[#f7f7fc]">
    <section className="home-universe" style={{ color: "#ffffff", background: "radial-gradient(ellipse at 12% 25%, rgba(113,67,227,.46), transparent 32%), radial-gradient(ellipse at 87% 72%, rgba(0,177,210,.28), transparent 31%), linear-gradient(145deg, #07081c 0%, #17133e 50%, #08263a 115%)" }}>
      <div className="cosmic-planets" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} className={`cosmic-planet cosmic-planet--${index + 1}`} />)}</div>
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 font-extrabold text-white"><span className="shrink-0 rounded-xl border border-white/15 bg-white/10 p-2 text-cyan-200 shadow-[0_0_24px_rgba(80,217,240,.18)] backdrop-blur"><Activity /></span><span className="truncate">Blood Pressure Tracker</span></div>
        <Link href="/login" className="btn border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15">Đăng nhập</Link>
      </header>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
        <div className="relative z-10 animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-xs font-bold text-cyan-100 shadow-lg backdrop-blur sm:text-sm"><Sparkles size={15} /> Sức khỏe giữa không gian vô cực</span>
          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.12] tracking-tight text-white [text-shadow:0_3px_24px_rgba(0,0,0,.3)] sm:text-5xl lg:text-7xl">Mỗi nhịp đập,<br/><span className="bg-gradient-to-r from-cyan-200 via-white to-violet-300 bg-clip-text text-transparent">một tín hiệu quan trọng.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,.35)] sm:text-lg">Theo dõi SYS, DIA và nhịp tim trong một không gian trực quan. Mọi thông số quan trọng luôn nổi bật, dễ đọc và được đánh giá ngay.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="btn btn-primary px-5">Bắt đầu miễn phí <ArrowRight size={18} /></Link><Link href="/login" className="btn border border-white/20 bg-white/10 px-5 text-white backdrop-blur hover:bg-white/15">Đăng nhập</Link></div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-indigo-100/55"><span>● Phân tích tức thì</span><span>● Báo cáo định kỳ</span><span>● Dữ liệu riêng tư</span></div>
        </div>
        <div className="relative min-h-[30rem] animate-rise [animation-delay:120ms]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%]" aria-hidden="true"><div className="home-planet" /></div>
          <div className="reading-console card absolute bottom-0 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 overflow-hidden p-4 backdrop-blur-2xl sm:p-6">
            <div className="flex items-center justify-between"><div><p className="eyebrow"><Orbit size={14}/> Tín hiệu gần nhất</p><p className="mt-1 text-xs text-slate-400">Hôm nay · 07:30</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">● Bình thường</span></div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">{[[118,"SYS","mmHg"],[76,"DIA","mmHg"],[72,"PULSE","lần/phút"]].map(([value,label,unit])=><div key={label} className="reading-value rounded-2xl p-3 text-center sm:p-4"><p className="text-[10px] font-black tracking-wider text-violet-600 sm:text-xs">{label}</p><b className="mt-1 block text-3xl tracking-tight sm:text-4xl">{value}</b><span className="text-[9px] text-slate-400 sm:text-[10px]">{unit}</span></div>)}</div>
          </div>
        </div>
      </div>
    </section>
    <main className="cosmic-shell">
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center"><p className="eyebrow justify-center"><Sparkles size={14}/> Hệ sinh thái theo dõi</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Thông số rõ ràng. Trải nghiệm khác biệt.</h2><p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">Thiết kế tập trung vào dữ liệu sức khỏe, không để hiệu ứng thị giác làm lu mờ điều quan trọng.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{features.map(({ icon: Icon, title, text }, index)=><article key={title} className="card feature-orbit p-5" style={{ animationDelay: `${index * 60}ms` }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-700"><Icon size={21}/></span><h3 className="mt-5 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}</div>
      </section>
    </main>
    <footer className="border-t border-violet-100 bg-white px-4 py-8 text-center text-xs leading-5 text-slate-500 sm:text-sm">Ứng dụng hỗ trợ theo dõi và tham khảo, không thay thế tư vấn y tế.</footer>
  </div>;
}
