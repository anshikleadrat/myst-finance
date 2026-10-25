import { LOAN_TYPE_PAGES } from '@/content/loan-types'
import { listPosts } from '@/content/mdx.server'
import { defaultLocale, localeMeta, locales } from '@/i18n/config'
import { absoluteUrl } from '@/lib/seo'
import type { Lender } from '@/lib/types'

const STATIC_PATHS: { path: string; priority: number; changefreq: string }[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/how-it-works', priority: 0.8, changefreq: 'monthly' },
  { path: '/loans', priority: 0.8, changefreq: 'monthly' },
  { path: '/lenders', priority: 0.9, changefreq: 'weekly' },
  { path: '/emi-calculator', priority: 0.8, changefreq: 'monthly' },
  { path: '/blog', priority: 0.6, changefreq: 'weekly' },
  { path: '/faq', priority: 0.6, changefreq: 'monthly' },
  { path: '/about', priority: 0.5, changefreq: 'yearly' },
  { path: '/contact', priority: 0.5, changefreq: 'yearly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
  { path: '/refund-policy', priority: 0.3, changefreq: 'yearly' },
  { path: '/disclaimer', priority: 0.3, changefreq: 'yearly' },
]

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Entry = { path: string; priority: number; changefreq: string; lastmod?: string; locales?: readonly string[] }

function urlBlock(entry: Entry): string {
  const available = (entry.locales ?? locales) as readonly (typeof locales)[number][]
  return available
    .map((locale) => {
      const alternates = available
        .map((alt) => `    <xhtml:link rel="alternate" hreflang="${localeMeta[alt].hrefLang}" href="${escapeXml(absoluteUrl(entry.path, alt))}"/>`)
        .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(entry.path, defaultLocale))}"/>`)
        .join('\n')
      return [
        '  <url>',
        `    <loc>${escapeXml(absoluteUrl(entry.path, locale))}</loc>`,
        entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : '',
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority.toFixed(1)}</priority>`,
        alternates,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
}

async function fetchLenders(): Promise<Lender[]> {
  const response = await fetch(`${process.env.API_INTERNAL_URL ?? 'http://localhost:8000'}/api/lenders`)
  if (!response.ok) throw new Error(`lenders request failed: ${response.status}`)
  return response.json()
}

export async function buildSitemap(): Promise<string> {
  const entries: Entry[] = [...STATIC_PATHS]
  for (const page of LOAN_TYPE_PAGES) entries.push({ path: `/loans/${page.slug}`, priority: 0.8, changefreq: 'monthly' })
  for (const lender of await fetchLenders()) {
    entries.push({ path: `/lenders/${lender.slug}`, priority: 0.7, changefreq: 'weekly', lastmod: lender.last_verified_on ?? undefined })
  }
  // A post is listed per language it exists in; alternates only point at existing translations.
  const bySlug = new Map<string, { locales: string[]; date?: string }>()
  for (const locale of locales) {
    for (const post of listPosts(locale)) {
      const item = bySlug.get(post.slug) ?? { locales: [], date: post.updated ?? post.date }
      item.locales.push(locale)
      bySlug.set(post.slug, item)
    }
  }
  for (const [slug, info] of bySlug) {
    entries.push({ path: `/blog/${slug}`, priority: 0.6, changefreq: 'monthly', lastmod: info.date, locales: info.locales })
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(urlBlock),
    '</urlset>',
    '',
  ].join('\n')
}

export function buildRss(): string {
  const posts = listPosts('en')
  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`)
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(post.description)}</description>`,
        post.date ? `      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>MYST Finance — Guides &amp; Articles</title>',
    `    <link>${escapeXml(absoluteUrl('/blog'))}</link>`,
    `    <atom:link href="${escapeXml(absoluteUrl('/rss.xml'))}" rel="self" type="application/rss+xml"/>`,
    '    <description>Plain-language guides on loans, credit scores and borrowing safely in India.</description>',
    '    <language>en-IN</language>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
