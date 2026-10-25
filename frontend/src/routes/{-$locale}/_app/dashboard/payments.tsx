import { Link, createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getMessages, useLocale, useT } from '@/i18n'
import { payments } from '@/lib/endpoints'
import { formatDate, formatPaise } from '@/lib/format'
import { localeFrom, seo } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_app/dashboard/payments')({
  loader: () => payments.list(),
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    return seo({ locale, path: '/dashboard/payments', title: getMessages(locale).myPayments.metaTitle, noindex: true })
  },
  component: PaymentsPage,
})

function PaymentsPage() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  const list = Route.useLoaderData()
  const p = t.myPayments

  return (
    <div className="space-y-6">
      <DashboardHeader title={p.title} subtitle={p.subtitle} />
      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{p.empty}</p>
        ) : (
          <Table className="min-w-[44rem]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>{p.columns.date}</TableHead>
                <TableHead>{p.columns.orderId}</TableHead>
                <TableHead>{p.columns.amount}</TableHead>
                <TableHead>{p.columns.method}</TableHead>
                <TableHead>{p.columns.status}</TableHead>
                <TableHead>{p.columns.invoice}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paid_at ?? payment.created_at, locale)}</TableCell>
                  <TableCell className="font-mono text-xs">{payment.invoice_number ?? payment.order_id}</TableCell>
                  <TableCell>{formatPaise(payment.amount_paise)}</TableCell>
                  <TableCell className="uppercase">{payment.method ?? '—'}</TableCell>
                  <TableCell className={cn('font-medium', payment.status === 'paid' ? 'text-success' : 'text-destructive')}>
                    {p.statuses[payment.status]}
                  </TableCell>
                  <TableCell>
                    {payment.status === 'paid' ? (
                      <a href={payments.invoiceUrl(payment.id)} download className="font-medium text-success hover:underline">
                        {t.common.download}
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-primary">{p.helpTitle}</p>
          <p className="text-sm text-muted-foreground">{p.helpBody}</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link to="/{-$locale}/dashboard/support" params={lp}>
            {p.helpCta}
          </Link>
        </Button>
      </div>
    </div>
  )
}
