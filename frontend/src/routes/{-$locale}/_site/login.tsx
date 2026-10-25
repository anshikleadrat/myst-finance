import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { AuthSidePanel } from '@/components/auth-side-panel'
import { FieldError, errorMessage } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { getMessages, useLocale, useT } from '@/i18n'
import { localeParam } from '@/i18n/config'
import { ApiError } from '@/lib/api'
import { auth } from '@/lib/endpoints'
import { fetchSession, invalidateSession, safeRedirect } from '@/lib/session'
import { localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/login')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: async ({ context, search }) => {
    const user = await fetchSession()
    if (user) {
      const target = safeRedirect(search.redirect)
      if (target) throw redirect({ href: target })
      throw redirect({ to: '/{-$locale}/dashboard', params: { locale: localeParam(context.locale) } })
    }
  },
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/login', title: getMessages(locale).auth.metaTitle, noindex: true })
  },
  component: LoginPage,
})

function formatCountdown(seconds: number) {
  return `00:${String(seconds).padStart(2, '0')}`
}

function LoginPage() {
  const t = useT()
  const [email, setEmail] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  return (
    <section className="bg-muted px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 rounded-3xl bg-gradient-to-br from-secondary/70 to-white p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
        {email === null ? (
          <>
            <AuthSidePanel showShield title1={t.auth.sideTitle1} title2={t.auth.sideTitle2} points={t.auth.sidePoints} />
            <EmailStep
              onSent={(value, resendAfter) => {
                setEmail(value)
                setCooldown(resendAfter)
              }}
            />
          </>
        ) : (
          <>
            <AuthSidePanel
              title1={t.auth.otpSideTitle1}
              title2={t.auth.otpSideTitle2}
              body={
                <>
                  <p>{t.auth.otpSideBody}</p>
                  <p className="mt-2 break-all font-semibold text-foreground">{email}</p>
                </>
              }
            />
            <OtpStep email={email} cooldown={cooldown} onResent={setCooldown} onChangeEmail={() => setEmail(null)} />
          </>
        )}
      </div>
    </section>
  )
}

function useAuthError() {
  const t = useT()
  return (error: unknown) => {
    if (error instanceof ApiError && error.code && t.auth.errors[error.code]) return t.auth.errors[error.code]
    if (error instanceof ApiError && error.status === 422) return t.auth.invalidEmail
    return error instanceof TypeError ? t.common.errorNetwork : t.common.errorGeneric
  }
}

function EmailStep({ onSent }: { onSent: (email: string, resendAfter: number) => void }) {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const describeError = useAuthError()
  const [serverError, setServerError] = useState<string>()

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onSubmit: z.object({ email: z.email(t.auth.invalidEmail) }) },
    onSubmit: async ({ value }) => {
      setServerError(undefined)
      const email = value.email.trim().toLowerCase()
      try {
        const result = await auth.requestOtp(email, locale)
        onSent(email, result.resend_after_seconds)
      } catch (error) {
        setServerError(describeError(error))
      }
    },
  })

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg shadow-primary/5 sm:p-10">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">{t.auth.title}</h1>
      <p className="mt-2 text-center text-muted-foreground">{t.auth.subtitle}</p>
      <form
        noValidate
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <form.Field name="email">
          {(field) => {
            const message = errorMessage(field.state.meta.errors, serverError)
            return (
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">
                  {t.auth.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  className="h-12 text-base"
                  placeholder={t.auth.emailPlaceholder}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={Boolean(message)}
                  aria-describedby={message ? 'email-error' : undefined}
                />
                <FieldError id="email-error" message={message} />
              </div>
            )
          }}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={isSubmitting}>
              {isSubmitting ? t.auth.sending : t.auth.sendOtp}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.agreePrefix}{' '}
        <Link to="/{-$locale}/terms" params={lp} className="font-medium text-primary underline underline-offset-2">
          {t.auth.terms}
        </Link>{' '}
        {t.auth.and}{' '}
        <Link to="/{-$locale}/privacy" params={lp} className="font-medium text-primary underline underline-offset-2">
          {t.auth.privacy}
        </Link>
      </p>
    </div>
  )
}

function OtpStep({
  email,
  cooldown,
  onResent,
  onChangeEmail,
}: {
  email: string
  cooldown: number
  onResent: (seconds: number) => void
  onChangeEmail: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const { redirect: redirectTo } = Route.useSearch()
  const { locale: localeParamValue } = useLocaleParams()
  const describeError = useAuthError()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>(t.auth.otpSent)
  const [busy, setBusy] = useState(false)
  const submitted = useRef('')

  const verify = async (value: string) => {
    if (value.length !== 6 || busy || submitted.current === value) return
    submitted.current = value
    setBusy(true)
    setError(undefined)
    try {
      await auth.verifyOtp(email, value)
      invalidateSession()
      const target = safeRedirect(redirectTo)
      if (target) await router.navigate({ href: target })
      else await router.navigate({ to: '/{-$locale}/dashboard', params: { locale: localeParamValue } })
    } catch (err) {
      setError(describeError(err))
      setCode('')
      submitted.current = ''
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError(undefined)
    try {
      const result = await auth.requestOtp(email, locale)
      onResent(result.resend_after_seconds)
      setNotice(t.auth.otpSent)
    } catch (err) {
      setError(describeError(err))
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg shadow-primary/5 sm:p-10">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">{t.auth.otpTitle}</h1>
      <p className="mt-2 text-center text-muted-foreground">{t.auth.otpSubtitle}</p>
      <p className="mt-1 break-all text-center font-semibold">{email}</p>
      <form
        className="mt-8 flex flex-col items-center gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          void verify(code)
        }}
      >
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => {
            setCode(value)
            if (value.length === 6) void verify(value)
          }}
          autoFocus
          inputMode="numeric"
          pattern="^[0-9]*$"
          aria-label={t.auth.otpLabel}
          aria-invalid={Boolean(error)}
        >
          <InputOTPGroup className="gap-2 sm:gap-3">
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot key={index} index={index} className="size-12 rounded-lg border text-lg first:rounded-lg last:rounded-lg sm:size-14" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <div aria-live="polite" className="min-h-5 text-center text-sm">
          {error ? <span className="text-destructive">{error}</span> : <span className="text-muted-foreground">{notice}</span>}
        </div>
        <Button type="submit" size="lg" className="h-12 w-full max-w-sm rounded-xl text-base" disabled={busy || code.length !== 6}>
          {busy ? t.auth.verifying : t.auth.verify}
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        {cooldown > 0 ? (
          <span className="font-medium text-success">{t.auth.resendIn(formatCountdown(cooldown))}</span>
        ) : (
          <button type="button" onClick={resend} className="font-medium text-success hover:underline">
            {t.auth.resend}
          </button>
        )}
        <button type="button" onClick={onChangeEmail} className="text-muted-foreground hover:text-foreground hover:underline">
          {t.auth.changeEmail}
        </button>
      </div>
    </div>
  )
}
