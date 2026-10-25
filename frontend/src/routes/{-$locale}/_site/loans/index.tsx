import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { PageHero } from '@/components/section-heading'
import { LOAN_TYPE_PAGES } from '@/content/loan-types'
import { getMessages, useLocale, useT } from '@/i18n'
import { ld, localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/loans/')({
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({
      locale,
      path: '/loans',
      title: t.loanTypes.metaTitle,
      description: t.loanTypes.metaDescription,
      jsonLd: ld.breadcrumbs(locale, [
        { name: t.nav.home, path: '/' },
        { name: t.loanTypes.title, path: '/loans' },
      ]),
    })
  },
  component: LoanTypesPage,
})

function LoanTypesPage() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  return (
    <>
      <PageHero title={t.loanTypes.title} subtitle={t.loanTypes.subtitle} />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <ul className="grid gap-6 md:grid-cols-2">
          {LOAN_TYPE_PAGES.map((page) => {
            const content = page.content[locale]
            return (
              <li key={page.slug} className="flex flex-col rounded-2xl border border-border bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">
                  <Link to="/{-$locale}/loans/$slug" params={{ ...lp, slug: page.slug }} className="hover:text-primary">
                    {content.name}
                  </Link>
                </h2>
                <p className="mt-2 font-medium text-foreground/80">{content.summary}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{content.intro[0]}</p>
                <Link
                  to="/{-$locale}/loans/$slug"
                  params={{ ...lp, slug: page.slug }}
                  className="mt-5 inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {t.common.learnMore}
                  <ArrowRight className="size-4" />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
