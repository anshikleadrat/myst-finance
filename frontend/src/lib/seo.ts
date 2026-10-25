import { defaultLocale, isLocale, localeMeta, localizePath, locales, type Locale } from '@/i18n/config'
import { SITE_URL } from './site'

export function localeFrom(param: string | undefined): Locale {
  return isLocale(param) ? param : defaultLocale
}

export function absoluteUrl(path: string, locale: Locale = defaultLocale): string {
  return `${SITE_URL}${localizePath(path, locale)}`
}

type JsonLd = Record<string, unknown>

type SeoInput = {
  locale: Locale
  /** Unlocalized path, e.g. `/lenders/moneytap`. */
  path: string
  title: string
  description?: string
  /** Private or thin pages: noindex and no hreflang alternates. */
  noindex?: boolean
  /** Set false for pages that only exist in one language. */
  alternates?: boolean
  type?: 'website' | 'article'
  image?: string
  jsonLd?: JsonLd | JsonLd[]
}

export function seo({ locale, path, title, description, noindex, alternates = true, type = 'website', image, jsonLd }: SeoInput) {
  const url = absoluteUrl(path, locale)
  const fullTitle = title.includes('MYST Finance') ? title : `${title} | MYST Finance`
  const ogImage = image ?? `${SITE_URL}/og-image.png`

  const meta: Record<string, string>[] = [
    { title: fullTitle },
    { property: 'og:title', content: fullTitle },
    { property: 'og:type', content: type },
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: 'MYST Finance' },
    { property: 'og:locale', content: localeMeta[locale].ogLocale },
    { property: 'og:image', content: ogImage },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
  ]
  if (description) {
    meta.push(
      { name: 'description', content: description },
      { property: 'og:description', content: description },
      { name: 'twitter:description', content: description },
    )
  }
  if (noindex) meta.push({ name: 'robots', content: 'noindex, nofollow' })

  const links: Record<string, string>[] = [{ rel: 'canonical', href: url }]
  if (alternates && !noindex) {
    for (const alt of locales) {
      links.push({ rel: 'alternate', hrefLang: localeMeta[alt].hrefLang, href: absoluteUrl(path, alt) })
    }
    links.push({ rel: 'alternate', hrefLang: 'x-default', href: absoluteUrl(path, defaultLocale) })
  }

  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []
  const scripts = blocks.map((block) => ({
    type: 'application/ld+json',
    // Escape `<` so a stray `</script>` in content can never break out of the tag.
    children: JSON.stringify({ '@context': 'https://schema.org', ...block }).replace(/</g, '\\u003c'),
  }))

  return { meta, links, scripts }
}

export const ld = {
  organization: (): JsonLd => ({
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'MYST Finance',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: 'support@mystfinance.in',
  }),
  website: (locale: Locale): JsonLd => ({
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'MYST Finance',
    url: absoluteUrl('/', locale),
    inLanguage: localeMeta[locale].htmlLang,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }),
  breadcrumbs: (locale: Locale, items: { name: string; path: string }[]): JsonLd => ({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, locale),
    })),
  }),
  faq: (items: { q: string; a: string }[]): JsonLd => ({
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }),
}
