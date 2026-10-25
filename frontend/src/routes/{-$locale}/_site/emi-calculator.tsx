import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { PageHero } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getMessages, useT } from '@/i18n'
import { calculateEmi } from '@/lib/emi'
import { formatINR } from '@/lib/format'
import { ld, localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

const LIMITS = {
  amount: { min: 10_000, max: 5_000_000, step: 5_000 },
  rate: { min: 5, max: 40, step: 0.25 },
  tenure: { min: 3, max: 84, step: 1 },
}
// Validated chart colours (dataviz validator: lightness, chroma, CVD and contrast checks pass).
const PRINCIPAL_COLOR = '#1d5fd8'
const INTEREST_COLOR = '#1f9d55'

const clamp = (value: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, value))

const DEFAULTS = { amount: 100_000, rate: 14, tenure: 24 }

// All params optional so the bare URL is canonical (no redirect to add defaults).
const searchSchema = z.object({
  amount: z.coerce.number().optional().catch(undefined),
  rate: z.coerce.number().optional().catch(undefined),
  tenure: z.coerce.number().int().optional().catch(undefined),
})

export const Route = createFileRoute('/{-$locale}/_site/emi-calculator')({
  validateSearch: searchSchema,
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({
      locale,
      path: '/emi-calculator',
      title: t.emi.metaTitle,
      description: t.emi.metaDescription,
      jsonLd: [
        {
          '@type': 'WebApplication',
          name: t.emi.title,
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR' },
        },
        ld.faq([{ q: t.emi.formulaTitle, a: t.emi.formulaBody }]),
      ],
    })
  },
  component: EmiPage,
})

function EmiPage() {
  const t = useT()
  const lp = useLocaleParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [values, setValues] = useState(() => ({
    amount: clamp(search.amount ?? DEFAULTS.amount, LIMITS.amount),
    rate: clamp(search.rate ?? DEFAULTS.rate, LIMITS.rate),
    tenure: clamp(search.tenure ?? DEFAULTS.tenure, LIMITS.tenure),
  }))

  // Keep the URL shareable without adding a history entry for every slider tick.
  useEffect(() => {
    if (values.amount === search.amount && values.rate === search.rate && values.tenure === search.tenure) return
    const untouched = values.amount === DEFAULTS.amount && values.rate === DEFAULTS.rate && values.tenure === DEFAULTS.tenure
    if (untouched && search.amount === undefined) return
    const id = setTimeout(() => {
      navigate({ search: values, replace: true, resetScroll: false })
    }, 300)
    return () => clearTimeout(id)
  }, [values, search, navigate])

  const result = calculateEmi(values.amount, values.rate, values.tenure)
  const principalShare = values.amount / result.totalPayment

  const field = (key: keyof typeof LIMITS, label: string, format: (n: number) => string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={`emi-${key}`} className="text-sm font-semibold">
          {label}
        </Label>
        <Input
          id={`emi-${key}`}
          type="number"
          inputMode="decimal"
          className="h-9 w-36 text-right font-semibold text-navy"
          min={LIMITS[key].min}
          max={LIMITS[key].max}
          step={LIMITS[key].step}
          value={values[key]}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) setValues((v) => ({ ...v, [key]: next }))
          }}
          onBlur={() => setValues((v) => ({ ...v, [key]: clamp(v[key], LIMITS[key]) }))}
        />
      </div>
      <Slider
        aria-label={label}
        min={LIMITS[key].min}
        max={LIMITS[key].max}
        step={LIMITS[key].step}
        value={[clamp(values[key], LIMITS[key])]}
        onValueChange={([next]) => setValues((v) => ({ ...v, [key]: next }))}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{format(LIMITS[key].min)}</span>
        <span>{format(LIMITS[key].max)}</span>
      </div>
    </div>
  )

  return (
    <>
      <PageHero title={t.emi.title} subtitle={t.emi.subtitle} />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          {field('amount', t.emi.amount, formatINR)}
          {field('rate', t.emi.rate, (n) => `${n}%`)}
          {field('tenure', t.emi.tenure, (n) => String(n))}
        </div>

        <div className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8" aria-live="polite">
          <p className="text-sm text-muted-foreground">{t.emi.monthlyEmi}</p>
          <p className="text-4xl font-extrabold text-primary">{formatINR(result.emi)}</p>

          <figure className="mt-6">
            <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${t.emi.principal} ${formatINR(values.amount)}, ${t.emi.interest} ${formatINR(result.totalInterest)}`}>
              <span className="h-full rounded-l-full" style={{ width: `${principalShare * 100}%`, backgroundColor: PRINCIPAL_COLOR }} title={`${t.emi.principal}: ${formatINR(values.amount)}`} />
              <span className="h-full flex-1 rounded-r-full" style={{ backgroundColor: INTEREST_COLOR }} title={`${t.emi.interest}: ${formatINR(result.totalInterest)}`} />
            </div>
            <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: PRINCIPAL_COLOR }} aria-hidden="true" />
                {t.emi.principal} {Math.round(principalShare * 100)}%
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: INTEREST_COLOR }} aria-hidden="true" />
                {t.emi.interest} {100 - Math.round(principalShare * 100)}%
              </span>
            </figcaption>
          </figure>

          <dl className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.emi.principal}</dt>
              <dd className="font-semibold text-navy">{formatINR(values.amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.emi.totalInterest}</dt>
              <dd className="font-semibold text-navy">{formatINR(result.totalInterest)}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt className="font-semibold">{t.emi.totalPayment}</dt>
              <dd className="font-bold text-navy">{formatINR(result.totalPayment)}</dd>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-8 rounded-xl">
            <Link to="/{-$locale}/apply" params={lp}>
              {t.emi.cta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-xl font-bold">{t.emi.schedule}</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>{t.emi.year}</TableHead>
                <TableHead className="text-right">{t.emi.principalPaid}</TableHead>
                <TableHead className="text-right">{t.emi.interestPaid}</TableHead>
                <TableHead className="text-right">{t.emi.balance}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.yearly.map((row) => (
                <TableRow key={row.year}>
                  <TableCell>{row.year}</TableCell>
                  <TableCell className="text-right">{formatINR(row.principal)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.interest)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-10 rounded-2xl bg-muted p-6">
          <h2 className="text-lg font-semibold">{t.emi.formulaTitle}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{t.emi.formulaBody}</p>
        </div>
      </section>
    </>
  )
}
