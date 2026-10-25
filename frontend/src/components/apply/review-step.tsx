import { useState } from 'react'
import type { Step } from './stepper'
import { StepActions } from './step-actions'
import { FormBanner, useServerErrors } from './use-step-form'
import { useLocale, useT } from '@/i18n'
import { applications } from '@/lib/endpoints'
import { formatDate, formatINR } from '@/lib/format'
import type { Application } from '@/lib/types'

export function ReviewStep({
  application,
  onSubmitted,
  onBack,
  onEdit,
}: {
  application: Application
  onSubmitted: (app: Application) => void
  onBack: () => void
  onEdit: (step: Step) => void
}) {
  const t = useT()
  const locale = useLocale()
  const r = t.apply.review
  const server = useServerErrors()
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const rows: { label: string; value: string; step: Step }[] = [
    { label: r.fullName, value: application.full_name ?? '—', step: 'personal' },
    { label: r.email, value: application.email, step: 'personal' },
    { label: r.dob, value: application.date_of_birth ? formatDate(application.date_of_birth, locale) : '—', step: 'personal' },
    { label: r.pan, value: application.pan_masked ?? '—', step: 'personal' },
    { label: r.city, value: application.city ?? '—', step: 'personal' },
    { label: r.employmentType, value: application.employment_type ? t.apply.employment.types[application.employment_type] : '—', step: 'employment' },
    { label: r.company, value: application.company_name ?? '—', step: 'employment' },
    { label: r.income, value: application.monthly_income ? formatINR(application.monthly_income) : '—', step: 'employment' },
    { label: r.experience, value: application.work_experience ? t.apply.employment.experiences[application.work_experience] : '—', step: 'employment' },
    { label: r.amount, value: application.loan_amount ? formatINR(application.loan_amount) : '—', step: 'loan' },
    { label: r.purpose, value: application.loan_purpose ? t.apply.loan.purposes[application.loan_purpose] : '—', step: 'loan' },
    { label: r.tenure, value: application.tenure_months ? t.common.months(application.tenure_months) : '—', step: 'loan' },
  ]

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!consent) {
          setConsentError(true)
          return
        }
        server.reset()
        setSubmitting(true)
        try {
          onSubmitted(await applications.submit(application.id))
        } catch (error) {
          server.capture(error)
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{r.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{r.subtitle}</p>
      </div>
      <FormBanner message={server.formError} />
      <dl className="divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_1.2fr_auto] items-center gap-3 px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="break-words font-medium">{row.value}</dd>
            <dd>
              <button
                type="button"
                className="text-sm font-medium text-primary underline underline-offset-2"
                onClick={() => onEdit(row.step)}
                aria-label={`${t.common.edit} ${row.label}`}
              >
                {t.common.edit}
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[var(--primary)]"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked)
            setConsentError(false)
          }}
          aria-invalid={consentError}
          aria-describedby={consentError ? 'consent-error' : undefined}
        />
        <span>{r.consent}</span>
      </label>
      {consentError && (
        <p id="consent-error" role="alert" className="text-sm text-destructive">
          {r.consentRequired}
        </p>
      )}
      <StepActions submitting={submitting} onBack={onBack} submitLabel={r.confirm} />
    </form>
  )
}
