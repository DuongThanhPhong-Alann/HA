import { AppShell } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("profiles").select("*").single();
  const profile = data as Profile | null;
  let avatarUrl: string | null = null;

  if (profile?.avatar_path) {
    const { data: signed } = await supabase.storage.from("bp-images").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return <AppShell><div className="mx-auto max-w-3xl p-4 sm:p-5 md:p-8">
    <p className="page-eyebrow text-sm font-bold">TÀI KHOẢN</p>
    <h1 className="page-heading mt-1 text-3xl font-black">Hồ sơ cá nhân</h1>
    <p className="page-subheading mb-7 mt-2">Thông tin giúp bạn quản lý hồ sơ theo dõi sức khỏe.</p>
    {user && <ProfileForm profile={profile} avatarUrl={avatarUrl} user={{ id: user.id, email: user.email }} />}
  </div></AppShell>;
}
