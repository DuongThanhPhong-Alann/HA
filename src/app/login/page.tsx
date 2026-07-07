import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { getLocale } from "@/lib/i18n-server";
import { text } from "@/lib/i18n";

export default async function Page({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const locale = await getLocale();
  const subtitle = reason === "idle"
    ? text(locale,"Bạn đã được đăng xuất sau 10 phút không hoạt động","You were signed out after 10 minutes of inactivity")
    : text(locale,"Đăng nhập để tiếp tục theo dõi chỉ số","Sign in to continue monitoring your blood pressure");

  return <AuthCard title={text(locale,"Chào mừng trở lại","Welcome back")} subtitle={subtitle} footer={<>{text(locale,"Chưa có tài khoản?","Need an account?")} <Link className="font-bold text-cyan-700" href="/register">{text(locale,"Đăng ký miễn phí","Create one")}</Link></>}><LoginForm locale={locale}/></AuthCard>;
}
