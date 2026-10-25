import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormItem, ariaFor } from './form-item'
import { StepActions } from './step-actions'
import { FormBanner, useServerErrors } from './use-step-form'
import { errorMessage } from '@/components/form-error'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useT } from '@/i18n'
import { applications } from '@/lib/endpoints'
import type { Application, EmploymentType, WorkExperience } from '@/lib/types'

const EMPLOYMENT_TYPES: EmploymentType[] = ['salaried', 'self_employed_professional', 'business_owner']
const EXPERIENCES: WorkExperience[] = ['lt_1', '1_3', '3_5', 'gt_5']

export function EmploymentStep({
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
  const f = t.apply.employment
  const server = useServerErrors()

  const schema = z.object({
    employment_type: z.enum(EMPLOYMENT_TYPES, v.select),
    company_name: z.string().trim().min(2, v.company).max(160, v.company),
    monthly_income: z.coerce.number<string>(v.income).int(v.income).min(1_000, v.income).max(10_000_000, v.income),
    work_experience: z.enum(EXPERIENCES, v.select),
  })

  const form = useForm({
    defaultValues: {
      employment_type: application.employment_type ?? '',
      company_name: application.company_name ?? '',
      monthly_income: application.monthly_income ? String(application.monthly_income) : '',
      work_experience: application.work_experience ?? '',
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      server.reset()
      try {
        onSaved(await applications.saveEmployment(application.id, schema.parse(value)))
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
      <form.Field name="employment_type">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.employment_type)
          return (
            <FormItem id="employment_type" label={f.type} error={error}>
              <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as EmploymentType)}>
                <SelectTrigger {...ariaFor('employment_type', error)} className="h-11 w-full">
                  <SelectValue placeholder={f.typePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {f.types[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )
        }}
      </form.Field>
      <form.Field name="company_name">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.company_name)
          return (
            <FormItem id="company_name" label={f.company} error={error}>
              <Input
                {...ariaFor('company_name', error)}
                autoComplete="organization"
                className="h-11"
                placeholder={f.companyPlaceholder}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </FormItem>
          )
        }}
      </form.Field>
      <form.Field name="monthly_income">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.monthly_income)
          return (
            <FormItem id="monthly_income" label={f.income} error={error}>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₹</span>
                <Input
                  {...ariaFor('monthly_income', error)}
                  inputMode="numeric"
                  className="h-11 pl-7"
                  placeholder={f.incomePlaceholder}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.replace(/[^\d]/g, ''))}
                  onBlur={field.handleBlur}
                />
              </div>
            </FormItem>
          )
        }}
      </form.Field>
      <form.Field name="work_experience">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.work_experience)
          return (
            <FormItem id="work_experience" label={f.experience} error={error}>
              <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as WorkExperience)}>
                <SelectTrigger {...ariaFor('work_experience', error)} className="h-11 w-full">
                  <SelectValue placeholder={f.experiencePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCES.map((experience) => (
                    <SelectItem key={experience} value={experience}>
                      {f.experiences[experience]}
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
