import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Lock } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getMessages, useLocale, useT } from '@/i18n'
import { account } from '@/lib/endpoints'
import { formatDate, formatPaise } from '@/lib/format'
import { localeFrom, seo } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_app/dashboard/')({
  loader: () => account.dashboard(),
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/dashboard', title: getMessages(locale).dashboard.metaTitle, noindex: true })
  },
  component: DashboardPage,
})

function DashboardPage() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const data = Route.useLoaderData()
  const d = t.dashboard

  const stats = [
    { label: d.stats.applications, value: String(data.applications_submitted).padStart(2, '0') },
    { label: d.stats.access, value: data.has_lender_access ? d.stats.active : d.stats.locked, tone: data.has_lender_access ? 'text-success' : 'text-muted-foreground' },
    { label: d.stats.payments, value: formatPaise(data.total_paid_paise) },
    { label: d.stats.totalLenders, value: `${data.total_lenders}+` },
  ]

  return (
    <div className="space-y-8">
      <DashboardHeader title={data.full_name ? d.welcome(data.full_name) : d.welcomeNoName} subtitle={d.subtitle} />

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className={cn('mt-2 text-3xl font-bold text-foreground', stat.tone)}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {!data.has_lender_access && (
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 font-medium text-navy">
            <Lock className="size-5 shrink-0 text-primary" aria-hidden="true" />
            {d.unlockPrompt}
          </p>
          <Button asChild className="shrink-0 rounded-xl">
            {data.applications_submitted > 0 ? (
              <Link to="/{-$locale}/checkout" params={lp}>
                {d.unlock} <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link to="/{-$locale}/apply" params={lp}>
                {d.startApplication} <ArrowRight className="size-4" />
              </Link>
            )}
          </Button>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">{d.recentActivity}</h2>
        {data.recent_activity.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{d.noActivity}</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead>{d.activity}</TableHead>
                  <TableHead className="text-right">{d.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_activity.map((event, index) => (
                  <TableRow key={`${event.kind}-${index}`}>
                    <TableCell>{d.activityKinds[event.kind] ?? event.kind}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(event.created_at, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
