import { AppShell } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { text } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import type { Profile } from "@/types/database";

export default async function Page() {
  const cookieLocale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("profiles").select("*").single();
  const profile = data as Profile | null;
  const locale = profile?.language ?? cookieLocale;
  let avatarUrl: string | null = null;

  if (profile?.avatar_path) {
    const { data: signed } = await supabase.storage.from("bp-images").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return <AppShell><div className="mx-auto max-w-3xl p-4 sm:p-5 md:p-8">
    <p className="page-eyebrow text-sm font-bold">{text(locale, "TÀI KHOẢN", "ACCOUNT")}</p>
    <h1 className="page-heading mt-1 text-3xl font-black">{text(locale, "Hồ sơ cá nhân", "Personal profile")}</h1>
    <p className="page-subheading mb-7 mt-2">{text(locale, "Thông tin giúp bạn quản lý hồ sơ theo dõi sức khỏe.", "Manage your health-monitoring profile and application preferences.")}</p>
    {user && <ProfileForm profile={profile} avatarUrl={avatarUrl} user={{ id: user.id, email: user.email }} initialLocale={locale} />}
  </div></AppShell>;
}
