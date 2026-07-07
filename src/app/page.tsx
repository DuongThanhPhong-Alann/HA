import { Activity, ArrowRight, BarChart3, Camera, HeartPulse, Leaf, LockKeyhole, ShieldCheck, Sprout } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: Activity, title: "Lưu lịch sử chỉ số", text: "Ghi lại SYS, DIA, nhịp tim và thời gian đo." },
  { icon: ShieldCheck, title: "Phân loại tức thì", text: "Nhận cảnh báo tham khảo rõ ràng sau mỗi lần đo." },
  { icon: Camera, title: "Lưu ảnh máy đo", text: "Đính kèm ảnh để đối chiếu khi cần." },
  { icon: BarChart3, title: "Theo dõi xu hướng", text: "Quan sát thay đổi chỉ số theo thời gian." },
  { icon: LockKeyhole, title: "Dữ liệu riêng tư", text: "Mỗi tài khoản chỉ truy cập dữ liệu của chính mình." },
];

export default function Home() {
  return <div className="min-h-screen bg-[#f3faf5]">
    <section className="home-wellness">
      <div className="wellness-nature" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} className={`nature-leaf nature-leaf--${index + 1}`} />)}</div>
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 font-extrabold text-white"><span className="shrink-0 rounded-xl border border-white/20 bg-white/10 p-2 text-emerald-100 shadow-[0_0_24px_rgba(110,231,183,.2)] backdrop-blur"><HeartPulse /></span><span className="truncate">Blood Pressure Tracker</span></div>
        <Link href="/login" className="btn border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15">Đăng nhập</Link>
      </header>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
        <div className="relative z-10 animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100/25 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-50 shadow-lg backdrop-blur sm:text-sm"><Sprout size={15} /> Sống xanh · Theo dõi sức khỏe chủ động</span>
          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.12] tracking-tight text-white [text-shadow:0_3px_24px_rgba(0,0,0,.22)] sm:text-5xl lg:text-7xl">Mỗi nhịp đập,<br/><span className="bg-gradient-to-r from-emerald-200 via-white to-lime-200 bg-clip-text text-transparent">một mầm sống khỏe.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 [text-shadow:0_2px_12px_rgba(0,0,0,.25)] sm:text-lg">Theo dõi huyết áp và nhịp tim trong không gian y tế sạch, gần gũi với thiên nhiên. Mọi chỉ số quan trọng luôn rõ ràng và được đánh giá ngay.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="btn btn-primary px-5">Bắt đầu miễn phí <ArrowRight size={18} /></Link><Link href="/login" className="btn border border-white/20 bg-white/10 px-5 text-white backdrop-blur hover:bg-white/15">Đăng nhập</Link></div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-emerald-50/65"><span>● Phân tích tức thì</span><span>● Báo cáo định kỳ</span><span>● Dữ liệu riêng tư</span></div>
        </div>
        <div className="relative min-h-[30rem] animate-rise [animation-delay:120ms]">
          <div className="wellness-hero-visual" aria-hidden="true"><span className="wellness-hero-visual__leaf"><Leaf/></span><span className="wellness-hero-visual__heart"><HeartPulse/></span><svg viewBox="0 0 420 70" preserveAspectRatio="none"><path d="M0 39 H82 L94 39 L103 25 L115 54 L132 5 L151 62 L167 39 H254 L266 39 L275 25 L287 54 L304 5 L323 62 L339 39 H420"/></svg></div>
          <div className="reading-console card absolute bottom-0 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 overflow-hidden p-4 backdrop-blur-2xl sm:p-6">
            <div className="flex items-center justify-between"><div><p className="eyebrow"><HeartPulse size={14}/> Tín hiệu gần nhất</p><p className="mt-1 text-xs text-slate-400">Hôm nay · 07:30</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">● Bình thường</span></div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">{[[118,"SYS","mmHg"],[76,"DIA","mmHg"],[72,"PULSE","lần/phút"]].map(([value,label,unit])=><div key={label} className="reading-value rounded-2xl p-3 text-center sm:p-4"><p className="text-[10px] font-black tracking-wider text-emerald-700 sm:text-xs">{label}</p><b className="mt-1 block text-3xl tracking-tight sm:text-4xl">{value}</b><span className="text-[9px] text-slate-400 sm:text-[10px]">{unit}</span></div>)}</div>
          </div>
        </div>
      </div>
    </section>
    <main className="wellness-shell">
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center"><p className="eyebrow justify-center"><Leaf size={14}/> Hệ sinh thái theo dõi</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Sức khỏe rõ ràng. Cuộc sống xanh hơn.</h2><p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">Thiết kế lấy cảm hứng từ y tế hiện đại và thiên nhiên, giúp dữ liệu dễ đọc mà vẫn nhẹ nhàng, gần gũi.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{features.map(({ icon: Icon, title, text }, index)=><article key={title} className="card feature-wellness p-5" style={{ animationDelay: `${index * 60}ms` }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-100 text-emerald-700"><Icon size={21}/></span><h3 className="mt-5 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}</div>
      </section>
    </main>
    <footer className="border-t border-emerald-100 bg-white px-4 py-8 text-center text-xs leading-5 text-slate-500 sm:text-sm">Ứng dụng hỗ trợ theo dõi và tham khảo, không thay thế tư vấn y tế.</footer>
  </div>;
}
