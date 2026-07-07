"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { text, type AppLocale } from "@/lib/i18n";

const IDLE_LIMIT_MS = 10 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;

export function IdleLogout({ userId, locale = "vi" }: { userId: string; locale?: AppLocale }) {
  const router = useRouter();

  useEffect(() => {
    const storageKey = `bp-tracker:last-activity:${userId}`;
    let logoutTimer: ReturnType<typeof setTimeout>;
    let warningTimer: ReturnType<typeof setTimeout>;
    let warningToast: string | number | undefined;
    let loggedOut = false;
    let lastRecordedAt = 0;

    const dismissWarning = () => {
      if (warningToast !== undefined) toast.dismiss(warningToast);
      warningToast = undefined;
    };

    const logout = async () => {
      if (loggedOut) return;
      loggedOut = true;
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
      dismissWarning();
      localStorage.removeItem(storageKey);

      try {
        await createClient().auth.signOut({ scope: "local" });
      } finally {
        router.replace("/login?reason=idle");
        router.refresh();
      }
    };

    const schedule = (lastActivity: number) => {
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
      dismissWarning();

      const remaining = IDLE_LIMIT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) {
        void logout();
        return;
      }

      if (remaining > WARNING_BEFORE_MS) {
        warningTimer = setTimeout(() => {
          warningToast = toast.warning(text(locale,"Phiên sẽ tự đăng xuất sau 1 phút do không hoạt động","Your session will end in 1 minute due to inactivity"), {
            duration: WARNING_BEFORE_MS,
            action: { label: text(locale,"Tiếp tục","Continue"), onClick: recordActivity },
          });
        }, remaining - WARNING_BEFORE_MS);
      } else {
        warningToast = toast.warning(text(locale,"Phiên sẽ sớm tự đăng xuất do không hoạt động","Your session will end shortly due to inactivity"), {
          duration: remaining,
          action: { label: text(locale,"Tiếp tục","Continue"), onClick: recordActivity },
        });
      }

      logoutTimer = setTimeout(() => void logout(), remaining);
    };

    function recordActivity() {
      if (loggedOut) return;
      const now = Date.now();
      if (now - lastRecordedAt < 1000) return;
      lastRecordedAt = now;
      localStorage.setItem(storageKey, String(now));
      schedule(now);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      if (event.newValue === null) {
        void logout();
        return;
      }
      const timestamp = Number(event.newValue);
      if (Number.isFinite(timestamp)) schedule(timestamp);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const timestamp = Number(localStorage.getItem(storageKey));
      schedule(Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now());
    };

    const savedActivity = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(savedActivity) && savedActivity > 0) schedule(savedActivity);
    else recordActivity();

    const activityEvents: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
      dismissWarning();
      activityEvents.forEach((event) => window.removeEventListener(event, recordActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [locale, router, userId]);

  return null;
}
