import { Link, createFileRoute } from '@tanstack/react-router'
import { Download, ExternalLink, Lock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/page-header'
import { DisclaimerNote } from '@/components/disclaimer-note'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getMessages, useT } from '@/i18n'
import { ApiError } from '@/lib/api'
import { lenders } from '@/lib/endpoints'
import { formatINR, formatRateRange } from '@/lib/format'
import { localeFrom, seo } from '@/lib/seo'
import type { LenderCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLocaleParams } from '@/lib/use-locale-params'

const TABS: (LenderCategory | 'all')[] = ['all', 'personal', 'business', 'other']

export const Route = createFileRoute('/{-$locale}/_app/dashboard/lenders')({
  loader: async () => {
    try {
      return await lenders.unlocked()
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) return null
      throw error
    }
  },
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/dashboard/lenders', title: getMessages(locale).lenderList.metaTitle, noindex: true })
  },
  component: LenderListPage,
})

function LenderListPage() {
  const t = useT()
  const lp = useLocaleParams()
  const data = Route.useLoaderData()
  const [tab, setTab] = useState<(typeof TABS)[number]>('all')
  const l = t.lenderList

  if (!data) {
    return (
      <div className="space-y-6">
        <DashboardHeader title={l.title} />
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-14 text-center shadow-sm">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">{l.lockedTitle}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{l.lockedBody}</p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/{-$locale}/checkout" params={lp}>
              {t.dashboard.unlock}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const shown = tab === 'all' ? data.lenders : data.lenders.filter((lender) => lender.category === tab)
  const count = (key: (typeof TABS)[number]) => (key === 'all' ? data.lenders.length : data.lenders.filter((lender) => lender.category === key).length)

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={l.title}
        subtitle={l.subtitle}
        action={
          <Button asChild className="rounded-xl">
            <a href={lenders.downloadUrl} download>
              <Download className="size-4" /> {l.download}
            </a>
          </Button>
        }
      />
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div role="tablist" aria-label={l.title} className="flex gap-1 overflow-x-auto border-b border-border px-4">
          {TABS.map((key) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors',
                tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {key === 'all' ? t.lenders.all : t.lenders.categories[key]} <span className="ml-1 text-xs opacity-70">{count(key)}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto p-4">
          <Table className="min-w-[56rem]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-10">{l.columns.index}</TableHead>
                <TableHead>{l.columns.name}</TableHead>
                <TableHead>{l.columns.type}</TableHead>
                <TableHead className="text-right">{l.columns.min}</TableHead>
                <TableHead className="text-right">{l.columns.max}</TableHead>
                <TableHead className="text-right">{l.columns.rate}</TableHead>
                <TableHead className="text-center">{l.columns.website}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((lender, index) => (
                <TableRow key={lender.slug}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <Link to="/{-$locale}/lenders/$slug" params={{ ...lp, slug: lender.slug }} className="font-medium hover:text-primary hover:underline">
                      {lender.name}
                    </Link>
                    {lender.matches_application && (
                      <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-success">
                        <Sparkles className="size-3" aria-hidden="true" /> {l.match}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{t.lenders.loanTypes[lender.loan_type]}</TableCell>
                  <TableCell className="text-right">{formatINR(lender.min_amount)}</TableCell>
                  <TableCell className="text-right">{formatINR(lender.max_amount)}</TableCell>
                  <TableCell className="text-right">
                    {formatRateRange(lender.rate_min_pa, lender.rate_max_pa)} <span className="text-xs text-muted-foreground">{t.common.perAnnum}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button asChild size="sm" variant="secondary" className="rounded-lg text-primary">
                      <a href={lender.website_url} target="_blank" rel="noopener noreferrer nofollow">
                        {t.lenders.visitWebsite} <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <DisclaimerNote>{t.common.indicativeNote}</DisclaimerNote>
    </div>
  )
}
