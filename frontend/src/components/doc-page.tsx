import { PageHero } from './section-heading'
import { Prose } from './prose'
import type { RenderedDoc } from '@/content/mdx'
import { useLocale } from '@/i18n'
import { formatDate } from '@/lib/format'
import { localeFrom, seo } from '@/lib/seo'

export function docHead(slug: string, param: string | undefined, doc: RenderedDoc | null | undefined) {
  if (!doc) return {}
  return seo({ locale: localeFrom(param), path: `/${slug}`, title: doc.frontmatter.title, description: doc.frontmatter.description })
}

export function DocPage({ doc }: { doc: RenderedDoc }) {
  const locale = useLocale()
  const updated = doc.frontmatter.updated
  return (
    <>
      <PageHero title={doc.frontmatter.title} subtitle={doc.frontmatter.description}>
        {updated && (
          <p className="mt-4 text-sm text-muted-foreground">
            <time dateTime={updated}>{formatDate(updated, locale)}</time>
          </p>
        )}
      </PageHero>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Prose html={doc.html} />
      </section>
    </>
  )
}
