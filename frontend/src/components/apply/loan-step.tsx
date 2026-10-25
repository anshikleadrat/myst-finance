import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormItem, ariaFor } from './form-item'
import { StepActions } from './step-actions'
import { FormBanner, useServerErrors } from './use-step-form'
import { errorMessage } from '@/components/form-error'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useT } from '@/i18n'
import { applications } from '@/lib/endpoints'
import { formatINR, formatNumber } from '@/lib/format'
import type { Application, LoanPurpose } from '@/lib/types'

export const AMOUNT_MIN = 10_000
export const AMOUNT_MAX = 1_000_000
export const TENURES = [6, 12, 18, 24, 36, 48, 60] as const
const PURPOSES: LoanPurpose[] = [
  'personal',
  'medical',
  'wedding',
  'travel',
  'education',
  'home_renovation',
  'debt_consolidation',
  'business',
  'other',
]

export function LoanStep({
  application,
  onSaved,
  onBack,
}: {
  application: Application
  onSaved: (app: Application) => void
  onBack: () => void
}) {
  const t = useT()
  const v = t.apply.validation
  const f = t.apply.loan
  const server = useServerErrors()

  const schema = z.object({
    loan_amount: z.number(v.amount).int(v.amount).min(AMOUNT_MIN, v.amount).max(AMOUNT_MAX, v.amount),
    loan_purpose: z.enum(PURPOSES, v.select),
    tenure_months: z.string().refine((value) => (TENURES as readonly number[]).includes(Number(value)), v.select),
  })

  const form = useForm({
    defaultValues: {
      loan_amount: application.loan_amount ?? 100_000,
      loan_purpose: application.loan_purpose ?? '',
      tenure_months: application.tenure_months ? String(application.tenure_months) : '',
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      server.reset()
      try {
        const parsed = schema.parse(value)
        onSaved(await applications.saveLoan(application.id, { ...parsed, tenure_months: Number(parsed.tenure_months) }))
      } catch (error) {
        server.capture(error)
      }
    },
  })

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <h2 className="text-xl font-bold sm:text-2xl">{f.title}</h2>
      <FormBanner message={server.formError} />
      <form.Field name="loan_amount">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.loan_amount)
          return (
            <FormItem id="loan_amount" label={f.amount} error={error}>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₹</span>
                <Input
                  {...ariaFor('loan_amount', error)}
                  inputMode="numeric"
                  className="h-11 pl-7 font-semibold"
                  value={formatNumber(field.state.value)}
                  onChange={(e) => field.handleChange(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                  onBlur={field.handleBlur}
                />
              </div>
              <Slider
                aria-label={f.amount}
                className="pt-3"
                min={AMOUNT_MIN}
                max={AMOUNT_MAX}
                step={5_000}
                value={[Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, field.state.value))]}
                onValueChange={([next]) => field.handleChange(next)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatINR(AMOUNT_MIN)}</span>
                <span>{formatINR(AMOUNT_MAX)}</span>
              </div>
            </FormItem>
          )
        }}
      </form.Field>
      <form.Field name="loan_purpose">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.loan_purpose)
          return (
            <FormItem id="loan_purpose" label={f.purpose} error={error}>
              <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as LoanPurpose)}>
                <SelectTrigger {...ariaFor('loan_purpose', error)} className="h-11 w-full">
                  <SelectValue placeholder={f.purposePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {f.purposes[purpose]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )
        }}
      </form.Field>
      <form.Field name="tenure_months">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.tenure_months)
          return (
            <FormItem id="tenure_months" label={f.tenure} error={error}>
              <Select value={field.state.value} onValueChange={field.handleChange}>
                <SelectTrigger {...ariaFor('tenure_months', error)} className="h-11 w-full">
                  <SelectValue placeholder={f.tenurePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {TENURES.map((months) => (
                    <SelectItem key={months} value={String(months)}>
                      {t.common.months(months)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )
        }}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(submitting) => <StepActions submitting={submitting} onBack={onBack} />}
      </form.Subscribe>
    </form>
  )
}
