import { Link, createFileRoute } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { z } from 'zod'
import { DisclaimerNote } from '@/components/disclaimer-note'
import { LenderCard } from '@/components/lender-card'
import { PageHero } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { getMessages, useT } from '@/i18n'
import { lenders as lendersApi } from '@/lib/endpoints'
import { absoluteUrl, ld, localeFrom, seo } from '@/lib/seo'
import type { LenderCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLocaleParams } from '@/lib/use-locale-params'

const CATEGORIES: LenderCategory[] = ['personal', 'business', 'other']

export const Route = createFileRoute('/{-$locale}/_site/lenders/')({
  validateSearch: z.object({ category: z.enum(['personal', 'business', 'other']).optional().catch(undefined) }),
  loader: () => lendersApi.list(),
  head: ({ params, loaderData }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({
      locale,
      path: '/lenders',
      title: t.lenders.metaTitle,
      description: t.lenders.metaDescription,
      jsonLd: [
        ld.breadcrumbs(locale, [
          { name: t.nav.home, path: '/' },
          { name: t.lenders.title, path: '/lenders' },
        ]),
        {
          '@type': 'ItemList',
          name: t.lenders.title,
          itemListElement: (loaderData ?? []).map((lender, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: lender.name,
            url: absoluteUrl(`/lenders/${lender.slug}`, locale),
          })),
        },
      ],
    })
  },
  component: LendersPage,
})

function LendersPage() {
  const t = useT()
  const lp = useLocaleParams()
  const all = Route.useLoaderData()
  const { category } = Route.useSearch()
  const shown = category ? all.filter((lender) => lender.category === category) : all
  const count = (c?: LenderCategory) => (c ? all.filter((lender) => lender.category === c).length : all.length)

  const tabClass = (active: boolean) =>
    cn(
      'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
      active ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground/80 hover:border-primary/40',
    )

  return (
    <>
      <PageHero title={t.lenders.title} subtitle={t.lenders.subtitle} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <nav aria-label={t.lenders.title} className="flex flex-wrap gap-2">
          <Link to="/{-$locale}/lenders" params={lp} search={{}} className={tabClass(!category)}>
            {t.lenders.all} <span className="opacity-70">{count()}</span>
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c} to="/{-$locale}/lenders" params={lp} search={{ category: c }} className={tabClass(category === c)}>
              {t.lenders.categories[c]} <span className="opacity-70">{count(c)}</span>
            </Link>
          ))}
        </nav>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((lender) => (
            <li key={lender.slug}>
              <LenderCard lender={lender} />
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Lock className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold">{t.lenders.lockedTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.lenders.lockedBody}</p>
            </div>
          </div>
          <Button asChild size="lg" className="shrink-0 rounded-xl">
            <Link to="/{-$locale}/apply" params={lp}>
              {t.home.heroCta}
            </Link>
          </Button>
        </div>
        <DisclaimerNote className="mt-6">{t.common.indicativeNote}</DisclaimerNote>
      </section>
    </>
  )
}
