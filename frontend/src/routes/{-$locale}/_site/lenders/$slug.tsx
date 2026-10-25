import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Check, ExternalLink, Lock } from 'lucide-react'
import { DisclaimerNote } from '@/components/disclaimer-note'
import { LenderAvatar } from '@/components/lender-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMessages, useLocale, useT } from '@/i18n'
import { ApiError } from '@/lib/api'
import { lenders as lendersApi } from '@/lib/endpoints'
import { formatDate, formatINR, formatRateRange } from '@/lib/format'
import { ld, localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/lenders/$slug')({
  loader: async ({ params }) => {
    try {
      return await lendersApi.get(params.slug)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound()
      throw error
    }
  },
  head: ({ params, loaderData: lender }) => {
    if (!lender) return {}
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    const rate = `${formatRateRange(lender.rate_min_pa, lender.rate_max_pa)} ${t.common.perAnnum}`
    return seo({
      locale,
      path: `/lenders/${lender.slug}`,
      title: t.lenders.metaDetailTitle(lender.name),
      description: t.lenders.metaDetailDescription(lender.name, formatINR(lender.min_amount), formatINR(lender.max_amount), rate),
      jsonLd: [
        ld.breadcrumbs(locale, [
          { name: t.nav.home, path: '/' },
          { name: t.lenders.title, path: '/lenders' },
          { name: lender.name, path: `/lenders/${lender.slug}` },
        ]),
        {
          '@type': 'LoanOrCredit',
          name: `${lender.name} ${t.lenders.loanTypes[lender.loan_type]}`,
          description: lender.tagline[locale],
          provider: { '@type': 'Organization', name: lender.name },
          currency: 'INR',
          amount: { '@type': 'MonetaryAmount', currency: 'INR', minValue: lender.min_amount, maxValue: lender.max_amount },
          interestRate: { '@type': 'QuantitativeValue', minValue: lender.rate_min_pa, maxValue: lender.rate_max_pa, unitText: 'PERCENT' },
          loanTerm: { '@type': 'QuantitativeValue', minValue: lender.tenure_min_months, maxValue: lender.tenure_max_months, unitCode: 'MON' },
        },
      ],
    })
  },
  component: LenderPage,
})

function LenderPage() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const lender = Route.useLoaderData()

  const stats = [
    { label: t.lenders.amount, value: `${formatINR(lender.min_amount)} – ${formatINR(lender.max_amount)}` },
    { label: t.lenders.interestRate, value: `${formatRateRange(lender.rate_min_pa, lender.rate_max_pa)} ${t.common.perAnnum}` },
    { label: t.lenders.processingFee, value: lender.processing_fee[locale] },
    { label: t.lenders.tenure, value: `${lender.tenure_min_months} – ${t.common.months(lender.tenure_max_months)}` },
  ]

  return (
    <div className="bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {lender.locked ? (
          <Link to="/{-$locale}/lenders" params={lp} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {t.lenders.backToDirectory}
          </Link>
        ) : (
          <Link to="/{-$locale}/dashboard/lenders" params={lp} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {t.lenders.backToList}
          </Link>
        )}

        <article className="mt-5 rounded-3xl border border-border bg-white shadow-sm">
          <header className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-5">
              <LenderAvatar name={lender.name} className="size-20 rounded-2xl text-2xl" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold sm:text-3xl">{lender.name}</h1>
                  <Badge variant="secondary" className="bg-success-soft text-success">
                    {t.lenders.loanTypes[lender.loan_type]}
                  </Badge>
                  {!lender.verified && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {t.common.indicative}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 max-w-xl leading-7 text-muted-foreground">{lender.tagline[locale]}</p>
                {lender.last_verified_on && (
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(lender.last_verified_on, locale)}</p>
                )}
              </div>
            </div>
            {lender.website_url ? (
              <Button asChild size="lg" className="shrink-0 rounded-xl">
                <a href={lender.website_url} target="_blank" rel="noopener noreferrer nofollow">
                  {t.lenders.visitOfficialWebsite}
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" className="shrink-0 rounded-xl">
                <Link to="/{-$locale}/checkout" params={lp}>
                  <Lock className="size-4" />
                  {t.lenders.unlockCta}
                </Link>
              </Button>
            )}
          </header>

          <dl className="grid grid-cols-2 border-y border-border md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className={`p-5 sm:px-8 ${index > 0 ? 'md:border-l' : ''} ${index % 2 ? 'border-l md:border-l' : ''} ${index > 1 ? 'border-t md:border-t-0' : ''} border-border`}>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 font-semibold text-navy">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-3">
            <section>
              <h2 className="text-base font-semibold">{t.lenders.about(lender.name)}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{lender.about[locale]}</p>
            </section>
            <section>
              <h2 className="text-base font-semibold">{t.lenders.features}</h2>
              <ul className="mt-3 space-y-2.5 text-sm">
                {lender.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="size-4 text-success" aria-hidden="true" />
                    {t.lenders.featureNames[feature]}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold">{t.lenders.documents}</h2>
              <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm marker:text-primary">
                {lender.documents.map((doc) => (
                  <li key={doc}>{t.lenders.documentNames[doc]}</li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        {lender.locked && (
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t.lenders.lockedTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.lenders.lockedBody}</p>
            </div>
            <Button asChild size="lg" className="shrink-0 rounded-xl">
              <Link to="/{-$locale}/checkout" params={lp}>{t.lenders.unlockCta}</Link>
            </Button>
          </section>
        )}
        <DisclaimerNote className="mt-6 bg-white">{t.common.indicativeNote} {t.disclaimer.short}</DisclaimerNote>
      </div>
    </div>
  )
}
