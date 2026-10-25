import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowRight, CircleCheck, FileText } from 'lucide-react'
import { DisclaimerNote } from '@/components/disclaimer-note'
import { FaqList } from '@/components/faq-list'
import { LenderCard } from '@/components/lender-card'
import { PageHero } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { getLoanTypePage } from '@/content/loan-types'
import { getMessages, useLocale, useT } from '@/i18n'
import { lenders as lendersApi } from '@/lib/endpoints'
import { ld, localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/loans/$slug')({
  loader: async ({ params }) => {
    const page = getLoanTypePage(params.slug)
    if (!page) throw notFound()
    const all = await lendersApi.list()
    return { slug: page.slug, lenders: all.filter((lender) => lender.loan_type === page.loanType) }
  },
  head: ({ params, loaderData }) => {
    const locale = localeFrom(params.locale)
    const page = loaderData && getLoanTypePage(loaderData.slug)
    if (!page) return {}
    const t = getMessages(locale)
    const content = page.content[locale]
    return seo({
      locale,
      path: `/loans/${page.slug}`,
      title: content.metaTitle,
      description: content.metaDescription,
      jsonLd: [
        ld.breadcrumbs(locale, [
          { name: t.nav.home, path: '/' },
          { name: t.loanTypes.title, path: '/loans' },
          { name: content.name, path: `/loans/${page.slug}` },
        ]),
        ld.faq(content.faqs),
      ],
    })
  },
  component: LoanTypePage,
})

function LoanTypePage() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const { slug, lenders } = Route.useLoaderData()
  const page = getLoanTypePage(slug)!
  const content = page.content[locale]

  return (
    <>
      <PageHero title={content.name} subtitle={content.summary}>
        <Button asChild size="lg" className="mt-7 h-13 rounded-xl px-7">
          <Link to="/{-$locale}/apply" params={lp}>
            {t.home.heroCta}
            <ArrowRight className="size-5" />
          </Link>
        </Button>
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <div className="space-y-4 text-[1.02rem] leading-8 text-foreground/85">
            {content.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <h2 className="mt-12 text-2xl font-bold">{t.loanTypes.lendersFor(content.name)}</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {lenders.map((lender) => (
              <li key={lender.slug}>
                <LenderCard lender={lender} />
              </li>
            ))}
          </ul>
          <DisclaimerNote className="mt-6">{t.common.indicativeNote}</DisclaimerNote>
          <h2 className="mt-12 text-2xl font-bold">{t.loanTypes.faq}</h2>
          <div className="mt-6">
            <FaqList items={content.faqs} />
          </div>
        </article>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold">{t.loanTypes.eligibility}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6">
              {content.eligibility.map((item) => (
                <li key={item} className="flex gap-2">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold">{t.loanTypes.documents}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {page.documents.map((doc) => (
                <li key={doc} className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" aria-hidden="true" />
                  {t.lenders.documentNames[doc]}
                </li>
              ))}
            </ul>
          </section>
          <Link to="/{-$locale}/emi-calculator" params={lp} className="block rounded-2xl bg-secondary p-6 font-semibold text-primary hover:underline">
            {t.nav.emiCalculator} →
          </Link>
        </aside>
      </div>
    </>
  )
}
