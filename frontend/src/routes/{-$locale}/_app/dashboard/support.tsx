import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { FormItem, ariaFor } from '@/components/apply/form-item'
import { errorMessage } from '@/components/form-error'
import { DashboardHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getMessages, useT } from '@/i18n'
import { ApiError } from '@/lib/api'
import { account } from '@/lib/endpoints'
import { localeFrom, seo } from '@/lib/seo'
import { SUPPORT_EMAIL } from '@/lib/site'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_app/dashboard/support')({
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/dashboard/support', title: getMessages(locale).support.metaTitle, noindex: true })
  },
  component: SupportPage,
})

function SupportPage() {
  const t = useT()
  const lp = useLocaleParams()
  const s = t.support
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string }>()

  const schema = z.object({
    subject: z.string().trim().min(3, t.common.required).max(150),
    message: z.string().trim().min(10, t.common.required).max(4000),
  })
  const form = useForm({
    defaultValues: { subject: '', message: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(undefined)
      try {
        await account.contactSupport({ subject: value.subject.trim(), message: value.message.trim() })
        setStatus({ tone: 'ok', text: s.sent })
        formApi.reset()
      } catch (error) {
        setStatus({ tone: 'error', text: error instanceof ApiError && error.status === 429 ? s.rateLimited : t.common.errorGeneric })
      }
    },
  })

  return (
    <div className="space-y-6">
      <DashboardHeader title={s.title} subtitle={s.subtitle} />
      <form
        noValidate
        className="max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        {status && (
          <p role="status" className={status.tone === 'ok' ? 'rounded-lg bg-success-soft px-4 py-3 text-sm text-success' : 'rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive'}>
            {status.text}
          </p>
        )}
        <form.Field name="subject">
          {(field) => {
            const error = errorMessage(field.state.meta.errors)
            return (
              <FormItem id="subject" label={s.subject} error={error}>
                <Input {...ariaFor('subject', error)} className="h-11" placeholder={s.subjectPlaceholder} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
              </FormItem>
            )
          }}
        </form.Field>
        <form.Field name="message">
          {(field) => {
            const error = errorMessage(field.state.meta.errors)
            return (
              <FormItem id="message" label={s.message} error={error}>
                <textarea
                  {...ariaFor('message', error)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                  placeholder={s.messagePlaceholder}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </FormItem>
            )
          }}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <Button type="submit" className="rounded-xl px-8" disabled={submitting}>
              {submitting ? t.common.saving : s.send}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className="text-sm text-muted-foreground">
        {s.orEmail}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
          {SUPPORT_EMAIL}
        </a>
        . {s.faqPrompt}{' '}
        <Link to="/{-$locale}/faq" params={lp} className="font-medium text-primary hover:underline">
          {t.nav.faq}
        </Link>
        .
      </p>
    </div>
  )
}
