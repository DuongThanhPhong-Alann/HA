import { cookies } from "next/headers";

import type { AppLocale } from "@/lib/i18n";

export async function getLocale(): Promise<AppLocale> {
  return (await cookies()).get("bp-locale")?.value === "en" ? "en" : "vi";
}
