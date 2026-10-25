import { Link, createFileRoute } from '@tanstack/react-router'
import { PageHero } from '@/components/section-heading'
import { getPosts } from '@/content/mdx'
import { getMessages, useLocale, useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/blog/')({
  loader: ({ params }) => getPosts({ data: { locale: localeFrom(params.locale) } }),
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({ locale, path: '/blog', title: t.blog.metaTitle, description: t.blog.metaDescription })
  },
  component: BlogIndex,
})

function BlogIndex() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const posts = Route.useLoaderData()
  return (
    <>
      <PageHero title={t.blog.title} subtitle={t.blog.subtitle} />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {posts.length === 0 && <p className="text-muted-foreground">{t.blog.empty}</p>}
        <ul className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
                <p className="text-xs text-muted-foreground">
                  {post.date && <time dateTime={post.date}>{formatDate(post.date, locale)}</time>}
                  {post.readingMinutes && <> · {t.blog.minRead(post.readingMinutes)}</>}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-snug">
                  <Link to="/{-$locale}/blog/$slug" params={{ ...lp, slug: post.slug }} className="hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{post.description}</p>
                <Link to="/{-$locale}/blog/$slug" params={{ ...lp, slug: post.slug }} className="mt-4 text-sm font-medium text-primary hover:underline">
                  {t.common.readMore} →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
