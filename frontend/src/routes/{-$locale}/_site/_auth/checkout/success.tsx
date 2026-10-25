import { Link, createFileRoute } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { getMessages, useT } from '@/i18n'
import { payments } from '@/lib/endpoints'
import { localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

const CONFETTI = [
  { left: '12%', top: '18%', color: '#1f9d55', rotate: 20 },
  { left: '20%', top: '42%', color: '#ef4444', rotate: -30 },
  { left: '27%', top: '12%', color: '#1f9d55', rotate: 45 },
  { left: '33%', top: '30%', color: '#f59e0b', rotate: 10 },
  { left: '17%', top: '62%', color: '#475569', rotate: 60 },
  { left: '24%', top: '76%', color: '#8b5cf6', rotate: -15 },
  { left: '63%', top: '20%', color: '#1f9d55', rotate: -40 },
  { left: '70%', top: '38%', color: '#0b40b8', rotate: 25 },
  { left: '76%', top: '14%', color: '#f59e0b', rotate: 70 },
  { left: '82%', top: '30%', color: '#0891b2', rotate: -20 },
  { left: '74%', top: '62%', color: '#ef4444', rotate: 35 },
  { left: '86%', top: '56%', color: '#0891b2', rotate: -55 },
]

export const Route = createFileRoute('/{-$locale}/_site/_auth/checkout/success')({
  validateSearch: z.object({ payment: z.string().optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ payment: search.payment }),
  loader: async ({ deps }) => {
    const list = await payments.list()
    return list.find((p) => p.id === deps.payment) ?? list.find((p) => p.status === 'paid') ?? null
  },
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/checkout/success', title: getMessages(locale).success.metaTitle, noindex: true })
  },
  component: SuccessPage,
})

function SuccessPage() {
  const t = useT()
  const lp = useLocaleParams()
  const payment = Route.useLoaderData()
  return (
    <section className="bg-muted px-4 py-10 sm:px-6 sm:py-16">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-white px-6 py-14 text-center shadow-sm">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              className="absolute h-1.5 w-3 rounded-sm opacity-80 motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]"
              style={{ left: piece.left, top: piece.top, backgroundColor: piece.color, transform: `rotate(${piece.rotate}deg)`, animationDelay: `${index * 0.15}s` }}
            />
          ))}
        </div>
        <span className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/30">
          <Check className="size-10" strokeWidth={3} aria-hidden="true" />
        </span>
        <h1 className="relative mt-6 text-2xl font-bold sm:text-3xl">{t.success.title}</h1>
        <p className="relative mt-3 text-muted-foreground">
          {t.success.body1}
          <br />
          {t.success.body2}
        </p>
        {payment?.invoice_number && <p className="relative mt-2 text-xs text-muted-foreground">{t.success.invoice(payment.invoice_number)}</p>}
        <Button asChild size="lg" className="relative mt-8 h-12 w-full max-w-sm rounded-xl text-base">
          <Link to="/{-$locale}/dashboard/lenders" params={lp}>
            {t.success.viewList}
          </Link>
        </Button>
        <p className="relative mt-5">
          <Link to="/{-$locale}/dashboard" params={lp} className="font-medium text-primary underline underline-offset-4">
            {t.success.goDashboard}
          </Link>
        </p>
      </div>
    </section>
  )
}
