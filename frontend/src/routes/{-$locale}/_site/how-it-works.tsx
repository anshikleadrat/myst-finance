import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { HowItWorksSteps } from '@/components/how-it-works-steps'
import { PageHero } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { getMessages, useT } from '@/i18n'
import { localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/how-it-works')({
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({
      locale,
      path: '/how-it-works',
      title: t.howItWorks.metaTitle,
      description: t.howItWorks.metaDescription,
      jsonLd: {
        '@type': 'HowTo',
        name: t.howItWorks.title,
        step: t.howItWorks.steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, name: step.title, text: step.body })),
      },
    })
  },
  component: HowItWorksPage,
})

function HowItWorksPage() {
  const t = useT()
  const lp = useLocaleParams()
  return (
    <>
      <PageHero title={t.howItWorks.title} subtitle={t.howItWorks.subtitle} />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <HowItWorksSteps />
        <p className="mx-auto mt-12 flex max-w-2xl items-center justify-center gap-3 rounded-xl bg-secondary px-6 py-4 text-center font-semibold text-primary">
          <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
          {t.howItWorks.banner}
        </p>
      </section>
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold">{t.howItWorks.detailTitle}</h2>
          <ol className="mt-8 space-y-6">
            {t.howItWorks.details.map((detail) => (
              <li key={detail.title} className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-lg font-semibold">{detail.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{detail.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="h-13 rounded-xl px-8">
              <Link to="/{-$locale}/apply" params={lp}>
                {t.home.heroCta}
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">{t.disclaimer.short}</p>
          </div>
        </div>
      </section>
    </>
  )
}
