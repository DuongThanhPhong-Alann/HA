import Link from "next/link"; import { AuthCard } from "@/components/auth/AuthCard"; import { ForgotForm } from "@/components/auth/PasswordForms";
export default function Page(){return <AuthCard title="Quên mật khẩu" subtitle="Nhập email để nhận liên kết đặt lại mật khẩu" footer={<Link href="/login" className="font-bold text-cyan-700">Quay lại đăng nhập</Link>}><ForgotForm/></AuthCard>}
