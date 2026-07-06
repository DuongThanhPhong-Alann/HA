import { Activity, BarChart3, Camera, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: Activity, title: "Lưu lịch sử chỉ số", text: "Ghi lại SYS, DIA, nhịp tim và thời gian đo." },
  { icon: ShieldCheck, title: "Phân loại tức thì", text: "Nhận cảnh báo tham khảo rõ ràng sau mỗi lần đo." },
  { icon: Camera, title: "Lưu ảnh máy đo", text: "Đính kèm ảnh để đối chiếu khi cần." },
  { icon: BarChart3, title: "Theo dõi xu hướng", text: "Quan sát thay đổi chỉ số theo thời gian." },
  { icon: LockKeyhole, title: "Dữ liệu riêng tư", text: "Mỗi tài khoản chỉ truy cập dữ liệu của chính mình." },
];

export default function Home() {
  return <div className="min-h-screen bg-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex min-w-0 items-center gap-2 font-extrabold"><span className="shrink-0 rounded-xl bg-cyan-50 p-2 text-cyan-700"><Activity/></span><span className="truncate">Blood Pressure Tracker</span></div>
      <Link href="/login" className="btn btn-outline hidden sm:inline-flex">Đăng nhập</Link>
    </header>
    <main>
      <section className="overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-blue-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-5 sm:py-20 md:grid-cols-2 md:py-28">
          <div><span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-cyan-800 shadow-sm sm:px-4 sm:text-sm">Sức khỏe trong tầm tay</span><h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:mt-7 md:text-6xl">Theo dõi huyết áp hằng ngày một cách đơn giản</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">Lưu lại chỉ số SYS, DIA, nhịp tim và hình ảnh máy đo. Hệ thống tự động phân loại mức cảnh báo để bạn dễ theo dõi sức khỏe.</p><div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap"><Link href="/register" className="btn btn-primary px-2 text-sm sm:px-4">Bắt đầu miễn phí</Link><Link href="/login" className="btn btn-outline px-2 text-sm sm:px-4">Đăng nhập</Link></div></div>
          <div className="card mx-auto w-full max-w-sm p-5 sm:p-7"><p className="text-xs font-bold text-slate-500 sm:text-sm">KẾT QUẢ GẦN NHẤT</p><div className="my-6 grid grid-cols-3 gap-2 text-center sm:my-7 sm:gap-3">{[[118,"SYS"],[76,"DIA"],[72,"PULSE"]].map(([value,label])=><div key={label}><b className="text-3xl sm:text-4xl">{value}</b><p className="text-xs text-slate-500">{label}</p></div>)}</div><div className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 sm:p-4 sm:text-base">● Huyết áp bình thường</div></div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-20"><div className="text-center"><h2 className="text-2xl font-black sm:text-3xl">Mọi thứ bạn cần để theo dõi tốt hơn</h2><p className="mt-3 text-sm text-slate-500 sm:text-base">Đơn giản, trực quan và bảo mật.</p></div><div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-5">{features.map(({icon:Icon,title,text})=><div key={title} className="card p-5"><Icon className="text-cyan-700"/><h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div></section>
    </main>
    <footer className="border-t px-4 py-8 text-center text-xs leading-5 text-slate-500 sm:px-5 sm:text-sm">Ứng dụng chỉ hỗ trợ theo dõi và tham khảo, không thay thế tư vấn y tế.</footer>
  </div>;
}
