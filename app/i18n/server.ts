import type { Locale } from "./config";
import { defaultLocale, supportedLocales } from "./config";

export const LOCALE_COOKIE_NAME = "tubegai_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getLocaleFromRequest(request: Request): Locale {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const localeCookie = cookies[LOCALE_COOKIE_NAME];

  if (localeCookie && supportedLocales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }

  // Fallback to Accept-Language header
  const acceptLanguage = request.headers.get("Accept-Language") ?? "";
  if (acceptLanguage.toLowerCase().includes("ko")) {
    return "ko";
  }

  return defaultLocale;
}

export function createLocaleCookie(locale: Locale): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...valueParts] = cookie.split("=");
    if (name && valueParts.length > 0) {
      cookies[name.trim()] = valueParts.join("=").trim();
    }
  });

  return cookies;
}
