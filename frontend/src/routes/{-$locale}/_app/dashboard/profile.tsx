import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormItem, ariaFor } from '@/components/apply/form-item'
import { errorMessage } from '@/components/form-error'
import { DashboardHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getMessages, useLocale, useT } from '@/i18n'
import { isLocale, localeMeta, locales, type Locale } from '@/i18n/config'
import { auth } from '@/lib/endpoints'
import { formatDate } from '@/lib/format'
import { invalidateSession } from '@/lib/session'
import { localeFrom, seo } from '@/lib/seo'

export const Route = createFileRoute('/{-$locale}/_app/dashboard/profile')({
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/dashboard/profile', title: getMessages(locale).profile.metaTitle, noindex: true })
  },
  component: ProfilePage,
})

function ProfilePage() {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const { user } = Route.useRouteContext()
  const p = t.profile

  const schema = z.object({ full_name: z.string().trim().min(2, t.apply.validation.name).max(120), locale: z.enum(locales) })
  const form = useForm({
    defaultValues: { full_name: user.full_name ?? '', locale: (isLocale(user.locale) ? user.locale : 'en') as Locale },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await auth.updateMe({ full_name: value.full_name.trim(), locale: value.locale })
        invalidateSession()
        await router.invalidate()
        toast.success(p.saved)
      } catch {
        toast.error(t.common.errorGeneric)
      }
    },
  })

  return (
    <div className="space-y-6">
      <DashboardHeader title={p.title} subtitle={p.subtitle} />
      <form
        noValidate
        className="max-w-xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <form.Field name="full_name">
          {(field) => {
            const error = errorMessage(field.state.meta.errors)
            return (
              <FormItem id="full_name" label={p.fullName} error={error}>
                <Input {...ariaFor('full_name', error)} className="h-11" autoComplete="name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
              </FormItem>
            )
          }}
        </form.Field>
        <FormItem id="email" label={p.email}>
          <Input id="email" className="h-11 bg-muted" value={user.email} readOnly aria-describedby="email-note" />
          <p id="email-note" className="text-xs text-muted-foreground">{p.emailNote}</p>
        </FormItem>
        <form.Field name="locale">
          {(field) => (
            <FormItem id="locale" label={p.language}>
              <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as Locale)}>
                <SelectTrigger id="locale" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((option) => (
                    <SelectItem key={option} value={option}>
                      {localeMeta[option].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        </form.Field>
        <p className="text-sm text-muted-foreground">
          {p.memberSince}: {formatDate(user.created_at, locale)}
        </p>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <Button type="submit" className="rounded-xl px-8" disabled={submitting}>
              {submitting ? t.common.saving : t.common.save}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
