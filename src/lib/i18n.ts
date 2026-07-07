export type AppLocale = "vi" | "en";

export const text = (locale: AppLocale, vietnamese: string, english: string) =>
  locale === "en" ? english : vietnamese;

export function persistLocale(locale: AppLocale) {
  document.cookie = `bp-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
