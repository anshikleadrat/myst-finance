export const locales = ['en', 'hi'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeMeta: Record<Locale, { label: string; htmlLang: string; hrefLang: string; ogLocale: string }> = {
  en: { label: 'English', htmlLang: 'en-IN', hrefLang: 'en-IN', ogLocale: 'en_IN' },
  hi: { label: 'हिन्दी', htmlLang: 'hi-IN', hrefLang: 'hi-IN', ogLocale: 'hi_IN' },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

/** Value for the optional `{-$locale}` path param: English has no prefix. */
export function localeParam(locale: Locale): Locale | undefined {
  return locale === defaultLocale ? undefined : locale
}

/** `/lenders` + `hi` -> `/hi/lenders`; `/` + `hi` -> `/hi`. */
export function localizePath(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/** Strip a locale prefix: `/hi/lenders` -> `/lenders`. */
export function unlocalizePath(pathname: string): string {
  for (const locale of locales) {
    if (locale === defaultLocale) continue
    if (pathname === `/${locale}`) return '/'
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1)
  }
  return pathname
}
