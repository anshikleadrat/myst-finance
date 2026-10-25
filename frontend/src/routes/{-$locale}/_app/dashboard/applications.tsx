import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getMessages, useLocale, useT } from '@/i18n'
import { applications } from '@/lib/endpoints'
import { formatDate, formatINR } from '@/lib/format'
import { localeFrom, seo } from '@/lib/seo'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_app/dashboard/applications')({
  loader: () => applications.list(),
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/dashboard/applications', title: getMessages(locale).myApplications.metaTitle, noindex: true })
  },
  component: ApplicationsPage,
})

function ApplicationsPage() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const apps = Route.useLoaderData()
  const a = t.myApplications
  const hasDraft = apps.some((app) => app.status === 'draft')

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={a.title}
        subtitle={a.subtitle}
        action={
          <Button asChild className="rounded-xl">
            <Link to="/{-$locale}/apply" params={lp}>
              <Plus className="size-4" /> {hasDraft ? t.dashboard.continueApplication : a.newApplication}
            </Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        {apps.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{a.empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>{a.started}</TableHead>
                <TableHead>{a.amount}</TableHead>
                <TableHead>{a.purpose}</TableHead>
                <TableHead>{a.tenure}</TableHead>
                <TableHead>{a.status}</TableHead>
                <TableHead className="text-right">{a.submitted}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{formatDate(app.created_at, locale)}</TableCell>
                  <TableCell className="font-medium">{app.loan_amount ? formatINR(app.loan_amount) : '—'}</TableCell>
                  <TableCell>{app.loan_purpose ? t.apply.loan.purposes[app.loan_purpose] : '—'}</TableCell>
                  <TableCell>{app.tenure_months ? t.common.months(app.tenure_months) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={app.status === 'submitted' ? 'bg-success-soft text-success' : ''}>
                      {a.statuses[app.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {app.submitted_at ? (
                      formatDate(app.submitted_at, locale)
                    ) : (
                      <Link to="/{-$locale}/apply" params={lp} className="font-medium text-primary hover:underline">
                        {a.continue}
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
