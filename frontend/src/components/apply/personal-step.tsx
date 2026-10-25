import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { FormItem, ariaFor } from './form-item'
import { StepActions } from './step-actions'
import { FormBanner, useServerErrors } from './use-step-form'
import { errorMessage } from '@/components/form-error'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useT } from '@/i18n'
import { CITIES } from '@/lib/cities'
import { applications } from '@/lib/endpoints'
import type { Application } from '@/lib/types'

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const OTHER = '__other__'

function age(dob: string): number {
  const birth = new Date(`${dob}T00:00:00`)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) years--
  return years
}

export function PersonalStep({ application, onSaved }: { application: Application; onSaved: (app: Application) => void }) {
  const t = useT()
  const v = t.apply.validation
  const f = t.apply.personal
  const server = useServerErrors()
  const [otherCity, setOtherCity] = useState(Boolean(application.city && !(CITIES as readonly string[]).includes(application.city)))

  const schema = z.object({
    full_name: z.string().trim().min(2, v.name).max(120, v.name),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, v.dob)
      .refine((value) => age(value) >= 18 && age(value) <= 75, v.age),
    pan: z.string().trim().toUpperCase().regex(PAN_RE, v.pan),
    city: z.string().trim().min(2, v.city).max(80, v.city),
  })

  const form = useForm({
    defaultValues: {
      full_name: application.full_name ?? '',
      date_of_birth: application.date_of_birth ?? '',
      pan: application.pan ?? '',
      city: application.city ?? '',
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      server.reset()
      try {
        onSaved(await applications.savePersonal(application.id, schema.parse(value)))
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
      <form.Field name="full_name">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.full_name)
          return (
            <FormItem id="full_name" label={f.fullName} error={error}>
              <Input
                {...ariaFor('full_name', error)}
                autoComplete="name"
                className="h-11"
                placeholder={f.fullNamePlaceholder}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </FormItem>
          )
        }}
      </form.Field>
      <FormItem id="email" label={f.email}>
        <Input id="email" className="h-11 bg-muted" value={application.email} readOnly />
      </FormItem>
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field name="date_of_birth">
          {(field) => {
            const error = errorMessage(field.state.meta.errors, server.fieldErrors.date_of_birth)
            return (
              <FormItem id="date_of_birth" label={f.dob} error={error}>
                <Input
                  {...ariaFor('date_of_birth', error)}
                  type="date"
                  autoComplete="bday"
                  className="h-11"
                  max={new Date().toISOString().slice(0, 10)}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </FormItem>
            )
          }}
        </form.Field>
        <form.Field name="pan">
          {(field) => {
            const error = errorMessage(field.state.meta.errors, server.fieldErrors.pan)
            return (
              <FormItem id="pan" label={f.pan} error={error}>
                <Input
                  {...ariaFor('pan', error)}
                  className="h-11 uppercase tracking-wider"
                  placeholder={f.panPlaceholder}
                  maxLength={10}
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                />
              </FormItem>
            )
          }}
        </form.Field>
      </div>
      <form.Field name="city">
        {(field) => {
          const error = errorMessage(field.state.meta.errors, server.fieldErrors.city)
          return (
            <FormItem id="city" label={f.city} error={error}>
              <Select
                value={otherCity ? OTHER : field.state.value}
                onValueChange={(value) => {
                  if (value === OTHER) {
                    setOtherCity(true)
                    field.handleChange('')
                  } else {
                    setOtherCity(false)
                    field.handleChange(value)
                  }
                }}
              >
                <SelectTrigger {...ariaFor('city', error)} className="h-11 w-full">
                  <SelectValue placeholder={f.cityPlaceholder} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER}>{f.otherCity}</SelectItem>
                </SelectContent>
              </Select>
              {otherCity && (
                <Input
                  aria-label={f.otherCity}
                  className="mt-2 h-11"
                  placeholder={f.otherCityPlaceholder}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </FormItem>
          )
        }}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(submitting) => <StepActions submitting={submitting} />}
      </form.Subscribe>
    </form>
  )
}
