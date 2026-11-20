import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["uz", "ru"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const cookie = (await cookies()).get("locale")?.value;
  const locale: Locale = (locales as readonly string[]).includes(cookie ?? "") ? (cookie as Locale) : "uz";
  return { locale, messages: (await import(`../messages/${locale}.json`)).default, timeZone: "Asia/Tashkent" };
});
