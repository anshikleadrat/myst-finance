import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeIndianRupee,
  BookOpenText,
  BriefcaseBusiness,
  CircleCheck,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Gem,
  Lock,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from 'lucide-react'
import { DisclaimerNote } from '@/components/disclaimer-note'
import { FaqList } from '@/components/faq-list'
import { HeroIllustration } from '@/components/hero-illustration'
import { HowItWorksSteps } from '@/components/how-it-works-steps'
import { LenderCard } from '@/components/lender-card'
import { SectionHeading } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { FAQ } from '@/content/faq'
import { LOAN_TYPE_PAGES } from '@/content/loan-types'
import { getMessages, useLocale, useT } from '@/i18n'
import { lenders as lendersApi } from '@/lib/endpoints'
import { formatINR } from '@/lib/format'
import { ld, localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

const MAX_APPLICATION_AMOUNT = 1_000_000
const LOAN_TYPE_ICONS = { personal: UserRound, business: BriefcaseBusiness, gold: Gem, education: GraduationCap }
const BENEFIT_ICONS = [FileCheck2, Target, ExternalLink, BadgeIndianRupee, Lock, BookOpenText]

export const Route = createFileRoute('/{-$locale}/_site/')({
  loader: async () => {
    const all = await lendersApi.list()
    const personal = all.filter((lender) => lender.category === 'personal')
    return {
      total: all.length,
      minRate: Math.min(...personal.map((lender) => lender.rate_min_pa)),
      featured: personal.slice(0, 6),
    }
  },
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({
      locale,
      path: '/',
      title: `${t.home.metaTitle} | MYST Finance`,
      description: t.home.metaDescription,
      jsonLd: [ld.organization(), ld.website(locale), ld.faq(FAQ[locale].slice(0, 4))],
    })
  },
  component: HomePage,
})

function HomePage() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const { total, minRate, featured } = Route.useLoaderData()

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-muted">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-16">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl lg:text-[3.4rem]">
              {t.home.heroTitle1}
              <span className="mt-1 block text-primary">{t.home.heroTitle2}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
              {t.home.heroSubtitle1}
              <br />
              {t.home.heroSubtitle2}
            </p>
            <ul className="mt-6 space-y-3">
              {t.home.heroPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 font-medium text-foreground/85">
                  <CircleCheck className="size-6 fill-success text-white" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 h-14 rounded-xl px-8 text-base shadow-lg shadow-primary/20">
              <Link to="/{-$locale}/apply" params={lp}>
                {t.home.heroCta}
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-success" aria-hidden="true" />
                {t.home.trust.secure}
              </li>
              <li className="flex items-center gap-2">
                <Lock className="size-5 text-primary" aria-hidden="true" />
                {t.home.trust.privacy}
              </li>
              <li className="flex items-center gap-2">
                <Users className="size-5 text-primary" aria-hidden="true" />
                {t.home.trust.lenders(total)}
              </li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <HeroIllustration className="h-auto w-full" />
            <div className="absolute -bottom-4 right-0 w-64 rounded-2xl border border-border bg-white p-5 shadow-xl sm:right-2 sm:w-72">
              <p className="text-sm text-muted-foreground">{t.home.offerCard.borrowUpTo}</p>
              <p className="text-3xl font-extrabold text-primary">{formatINR(MAX_APPLICATION_AMOUNT)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t.home.offerCard.interestRate}</p>
                  <p className="font-bold text-navy">
                    {minRate}%* <span className="text-xs font-normal text-muted-foreground">{t.home.offerCard.ratePrefix}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.home.offerCard.tenure}</p>
                  <p className="font-bold text-navy">6 – 60 {t.common.monthsShort}</p>
                </div>
              </div>
              <p className="mt-2 text-[0.7rem] text-muted-foreground">{t.home.offerCard.footnote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading title={t.howItWorks.title} subtitle={t.howItWorks.subtitle} />
          <div className="mt-14">
            <HowItWorksSteps />
          </div>
          <p className="mx-auto mt-12 flex max-w-2xl items-center justify-center gap-3 rounded-xl bg-secondary px-6 py-4 text-center font-semibold text-primary">
            <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
            {t.howItWorks.banner}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="scroll-mt-20 bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading title={t.home.benefitsTitle} subtitle={t.home.benefitsSubtitle} />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.home.benefits.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index]
              return (
                <li key={benefit.title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-success-soft text-success">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Loan types */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading title={t.home.loanTypesTitle} subtitle={t.home.loanTypesSubtitle} />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LOAN_TYPE_PAGES.map((page) => {
              const Icon = LOAN_TYPE_ICONS[page.loanType]
              const content = page.content[locale]
              return (
                <li key={page.slug}>
                  <Link
                    to="/{-$locale}/loans/$slug"
                    params={{ ...lp, slug: page.slug }}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{content.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{content.summary}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {t.common.learnMore}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Lenders teaser */}
      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title={t.home.lendersTitle} subtitle={t.home.lendersSubtitle} align="left" />
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/{-$locale}/lenders" params={lp}>
                {t.common.viewAll} ({total})
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((lender) => (
              <li key={lender.slug}>
                <LenderCard lender={lender} />
              </li>
            ))}
          </ul>
          <DisclaimerNote className="mt-8">{t.common.indicativeNote}</DisclaimerNote>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading title={t.home.faqTitle} />
          <div className="mt-10">
            <FaqList items={FAQ[locale].slice(0, 4)} />
          </div>
          <p className="mt-6 text-center">
            <Link to="/{-$locale}/faq" params={lp} className="font-medium text-primary hover:underline">
              {t.common.viewAll}
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 rounded-3xl bg-gradient-to-r from-primary to-[#1652d6] px-6 py-12 text-center text-white sm:py-14">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t.home.finalCtaTitle}</h2>
          <p className="text-white/85">{t.home.finalCtaBody}</p>
          <Button asChild size="lg" variant="secondary" className="h-13 rounded-xl px-8 text-base text-primary">
            <Link to="/{-$locale}/apply" params={lp}>
              {t.home.heroCta}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <p className="max-w-2xl text-xs text-white/70">{t.disclaimer.short}</p>
        </div>
      </section>
    </>
  )
}
