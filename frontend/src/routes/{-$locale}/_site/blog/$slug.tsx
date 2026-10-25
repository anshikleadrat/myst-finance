import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Prose } from '@/components/prose'
import { getPost } from '@/content/mdx'
import { getMessages, useLocale, useT } from '@/i18n'
import { localeMeta } from '@/i18n/config'
import { formatDate } from '@/lib/format'
import { absoluteUrl, ld, localeFrom, seo } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/blog/$slug')({
  loader: async ({ params }) => {
    const post = await getPost({ data: { slug: params.slug, locale: localeFrom(params.locale) } })
    if (!post) throw notFound()
    return { ...post, slug: params.slug }
  },
  head: ({ params, loaderData: post }) => {
    if (!post) return {}
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    const path = `/blog/${post.slug}`
    return seo({
      locale,
      path,
      type: 'article',
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      jsonLd: [
        {
          '@type': 'Article',
          headline: post.frontmatter.title,
          description: post.frontmatter.description,
          datePublished: post.frontmatter.date,
          dateModified: post.frontmatter.updated ?? post.frontmatter.date,
          inLanguage: localeMeta[locale].htmlLang,
          mainEntityOfPage: absoluteUrl(path, locale),
          author: { '@type': 'Organization', name: 'MYST Finance', url: SITE_URL },
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
        ld.breadcrumbs(locale, [
          { name: t.nav.home, path: '/' },
          { name: t.nav.blog, path: '/blog' },
          { name: post.frontmatter.title, path },
        ]),
      ],
    })
  },
  component: BlogPost,
})

function BlogPost() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const post = Route.useLoaderData()
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/{-$locale}/blog" params={lp} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t.blog.backToBlog}
      </Link>
      <header className="mt-6 border-b border-border pb-8">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{post.frontmatter.title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{post.frontmatter.description}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          {post.frontmatter.date && (
            <>
              {t.blog.publishedOn} <time dateTime={post.frontmatter.date}>{formatDate(post.frontmatter.date, locale)}</time>
            </>
          )}
          {post.frontmatter.readingMinutes && <> · {t.blog.minRead(post.frontmatter.readingMinutes)}</>}
        </p>
      </header>
      <Prose html={post.html} className="mt-8" />
    </article>
  )
}
