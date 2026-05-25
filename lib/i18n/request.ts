import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isLocale, type Locale } from "./config";

/**
 * Pick the first supported locale named in the browser's Accept-Language
 * header, honoring its q-weights. Falls back to DEFAULT_LOCALE when none
 * of our locales appear. Only consulted on the first visit (no cookie yet) —
 * an explicit user choice (the cookie) always wins.
 */
function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const weight = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { lang: tag.toLowerCase().split("-")[0], q: Number.isNaN(weight) ? 1 : weight };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of ranked) {
    if (LOCALES.includes(lang as Locale)) return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;

  let locale: Locale;
  if (isLocale(cookieValue)) {
    locale = cookieValue;
  } else {
    const headerStore = await headers();
    locale = localeFromAcceptLanguage(headerStore.get("accept-language"));
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
