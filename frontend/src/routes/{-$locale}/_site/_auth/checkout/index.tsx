import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { CircleCheck, CreditCard, Landmark, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getMessages, useT } from '@/i18n'
import { localeParam } from '@/i18n/config'
import { ApiError } from '@/lib/api'
import { applications, lenders, payments } from '@/lib/endpoints'
import { formatINR } from '@/lib/format'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { invalidateSession } from '@/lib/session'
import { localeFrom, seo } from '@/lib/seo'
import { ACCESS_FEE_RUPEES } from '@/lib/site'
import type { CreatedOrder, PaymentMethod } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLocaleParams } from '@/lib/use-locale-params'

const METHODS: { id: PaymentMethod; icon: typeof Smartphone }[] = [
  { id: 'upi', icon: Smartphone },
  { id: 'card', icon: CreditCard },
  { id: 'netbanking', icon: Landmark },
  { id: 'wallet', icon: Wallet },
]

export const Route = createFileRoute('/{-$locale}/_site/_auth/checkout/')({
  beforeLoad: ({ context }) => {
    if (context.user.has_lender_access) {
      throw redirect({ to: '/{-$locale}/dashboard/lenders', params: { locale: localeParam(context.locale) } })
    }
  },
  loader: async ({ context }) => {
    const [apps, all] = await Promise.all([applications.list(), lenders.list()])
    if (!apps.some((app) => app.status === 'submitted')) {
      throw redirect({ to: '/{-$locale}/apply', params: { locale: localeParam(context.locale) } })
    }
    return { lenderCount: all.length }
  },
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/checkout', title: getMessages(locale).checkout.metaTitle, noindex: true })
  },
  component: CheckoutPage,
})

function CheckoutPage() {
  const t = useT()
  const lp = useLocaleParams()
  const navigate = useNavigate()
  const { lenderCount } = Route.useLoaderData()
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string }>()
  const [mockOrder, setMockOrder] = useState<CreatedOrder | null>(null)
  const amount = formatINR(ACCESS_FEE_RUPEES)

  const complete = async (signed: { order_id: string; provider_payment_id: string; signature: string }) => {
    const payment = await payments.verify(signed)
    invalidateSession()
    await navigate({ to: '/{-$locale}/checkout/success', params: lp, search: { payment: payment.id } })
  }

  const describe = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'application_required') return t.checkout.needApplication
    return error instanceof TypeError ? t.common.errorNetwork : t.common.errorGeneric
  }

  const pay = async () => {
    setBusy(true)
    setMessage(undefined)
    try {
      const order = await payments.createOrder(method)
      if (order.provider === 'mock') {
        setMockOrder(order)
        return
      }
      const outcome = await openRazorpayCheckout(order, method, t.checkout.metaTitle)
      if (outcome.status === 'success') await complete(outcome)
      else setMessage({ tone: outcome.status === 'failed' ? 'error' : 'info', text: outcome.status === 'failed' ? t.checkout.failed : t.checkout.cancelled })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'already_unlocked') {
        invalidateSession()
        await navigate({ to: '/{-$locale}/dashboard/lenders', params: lp })
        return
      }
      setMessage({ tone: 'error', text: describe(error) })
    } finally {
      setBusy(false)
    }
  }

  const finishMock = async (succeed: boolean) => {
    const order = mockOrder
    setMockOrder(null)
    if (!order) return
    if (!succeed) {
      setMessage({ tone: 'error', text: t.checkout.failed })
      return
    }
    setBusy(true)
    try {
      await complete(await payments.mockAuthorize(order.order_id, method))
    } catch (error) {
      setMessage({ tone: 'error', text: describe(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-muted px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 rounded-3xl bg-gradient-to-br from-secondary/60 to-white p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {t.checkout.title1}
            <br />
            {t.checkout.title2}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{t.checkout.subtitle}</p>
          <ul className="mt-6 space-y-3">
            {t.checkout.points(lenderCount).map((point) => (
              <li key={point} className="flex items-center gap-3 font-medium text-foreground/85">
                <CircleCheck className="size-5 fill-success text-white" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-primary/5 sm:p-8">
          <h2 className="text-xl font-bold">{t.checkout.paymentDetails}</h2>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.checkout.amountToPay}</p>
              <p className="text-3xl font-extrabold">{amount}</p>
            </div>
            <Badge className="bg-success-soft text-success hover:bg-success-soft">{t.checkout.oneTime}</Badge>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">{t.checkout.selectMethod}</legend>
            <RadioGroup value={method} onValueChange={(value) => setMethod(value as PaymentMethod)} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {METHODS.map(({ id, icon: Icon }) => (
                <label
                  key={id}
                  htmlFor={`method-${id}`}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors',
                    method === id ? 'border-primary bg-secondary text-primary ring-1 ring-primary' : 'border-border hover:border-primary/40',
                  )}
                >
                  <RadioGroupItem id={`method-${id}`} value={id} className="sr-only" />
                  <Icon className="size-6" aria-hidden="true" />
                  {t.checkout.methods[id]}
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          {message && (
            <p role="alert" className={cn('mt-5 rounded-lg px-4 py-3 text-sm', message.tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-navy')}>
              {message.text}
            </p>
          )}

          <Button size="lg" className="mt-6 h-13 w-full rounded-xl text-base" onClick={pay} disabled={busy}>
            {busy ? t.checkout.processing : t.checkout.pay(amount)}
          </Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-success">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t.checkout.secure}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">{t.checkout.secureNote}</p>
          <p className="mt-5 rounded-lg bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
            {t.checkout.feeNote}{' '}
            <Link to="/{-$locale}/refund-policy" params={lp} className="font-medium text-primary underline">
              {t.checkout.refundLink}
            </Link>
          </p>
        </div>
      </div>

      <Dialog open={mockOrder !== null} onOpenChange={(open) => !open && setMockOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.checkout.mockTitle}</DialogTitle>
            <DialogDescription>{t.checkout.mockBody}</DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            {amount} · {t.checkout.methods[method]}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => finishMock(false)}>
              {t.checkout.mockFail}
            </Button>
            <Button onClick={() => finishMock(true)}>{t.checkout.mockSucceed}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
