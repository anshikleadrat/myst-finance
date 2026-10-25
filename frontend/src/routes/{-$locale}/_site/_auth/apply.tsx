import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { EmploymentStep } from '@/components/apply/employment-step'
import { LoanStep } from '@/components/apply/loan-step'
import { PersonalStep } from '@/components/apply/personal-step'
import { ReviewStep } from '@/components/apply/review-step'
import { STEPS, Stepper, type Step } from '@/components/apply/stepper'
import { getMessages, useT } from '@/i18n'
import { applications } from '@/lib/endpoints'
import { invalidateSession } from '@/lib/session'
import { localeFrom, seo } from '@/lib/seo'
import type { Application } from '@/lib/types'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/_auth/apply')({
  validateSearch: z.object({ step: z.enum(STEPS).optional().catch(undefined) }),
  // Returns the open draft (or starts one prefilled from the previous application).
  loader: () => applications.start(),
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/apply', title: getMessages(locale).apply.metaTitle, noindex: true })
  },
  component: ApplyPage,
})

/** Furthest step the user may open: the first incomplete one, or review when all are done. */
function firstOpenStep(app: Application): Step {
  return STEPS.find((step) => step !== 'review' && !app.completed_steps.includes(step)) ?? 'review'
}

function ApplyPage() {
  const t = useT()
  const lp = useLocaleParams()
  const navigate = useNavigate({ from: Route.fullPath })
  const { user } = Route.useRouteContext()
  const initial = Route.useLoaderData()
  const [application, setApplication] = useState<Application>(initial)
  const { step: requested } = Route.useSearch()

  const limit = firstOpenStep(application)
  const step = requested && STEPS.indexOf(requested) <= STEPS.indexOf(limit) ? requested : limit
  const goTo = (next: Step) => navigate({ search: { step: next } })
  const advance = (app: Application) => {
    setApplication(app)
    goTo(STEPS[STEPS.indexOf(step) + 1])
  }

  const why = {
    personal: { icon: LockKeyhole, title: t.apply.whyTitle, body: t.apply.whyPersonal },
    employment: { icon: LockKeyhole, title: t.apply.whyTitle, body: t.apply.whyEmployment },
    loan: { icon: LockKeyhole, title: t.apply.whyTitle, body: t.apply.whyLoan },
    review: { icon: ShieldCheck, title: t.apply.safeTitle, body: t.apply.safeBody },
  }[step]

  return (
    <section className="bg-muted px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl bg-white/60 p-4 sm:p-6 lg:grid-cols-[15rem_1fr_16rem] lg:p-8">
        <h1 className="sr-only">{t.apply.steps[STEPS.indexOf(step)]}</h1>
        <div className="lg:pt-4">
          <Stepper current={step} completed={application.completed_steps} onSelect={goTo} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-8">
          {step === 'personal' && <PersonalStep key={application.id} application={application} onSaved={advance} />}
          {step === 'employment' && <EmploymentStep application={application} onSaved={advance} onBack={() => goTo('personal')} />}
          {step === 'loan' && <LoanStep application={application} onSaved={advance} onBack={() => goTo('employment')} />}
          {step === 'review' && (
            <ReviewStep
              application={application}
              onBack={() => goTo('loan')}
              onEdit={goTo}
              onSubmitted={async () => {
                invalidateSession()
                if (user.has_lender_access) await navigate({ to: '/{-$locale}/dashboard/lenders', params: lp })
                else await navigate({ to: '/{-$locale}/checkout', params: lp })
              }}
            />
          )}
        </div>
        <aside className="self-start rounded-2xl border border-border bg-white p-6 lg:mt-16">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <why.icon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold leading-snug">{why.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{why.body}</p>
        </aside>
      </div>
    </section>
  )
}
