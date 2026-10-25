import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { LenderAvatar } from './lender-avatar'
import { Badge } from '@/components/ui/badge'
import { useLocale, useT } from '@/i18n'
import { formatINRCompact, formatRateRange } from '@/lib/format'
import type { Lender } from '@/lib/types'
import { useLocaleParams } from '@/lib/use-locale-params'

export function LenderCard({ lender }: { lender: Lender }) {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()
  return (
    <Link
      to="/{-$locale}/lenders/$slug"
      params={{ ...lp, slug: lender.slug }}
      className="group flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <LenderAvatar name={lender.name} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{lender.name}</h3>
          <Badge variant="secondary" className="mt-1 bg-success-soft text-success">
            {t.lenders.loanTypes[lender.loan_type]}
          </Badge>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{lender.tagline[locale]}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t.lenders.amount}</dt>
          <dd className="font-semibold text-navy">
            {t.common.upTo} {formatINRCompact(lender.max_amount, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t.lenders.interestRate}</dt>
          <dd className="font-semibold text-navy">{formatRateRange(lender.rate_min_pa, lender.rate_max_pa)}</dd>
        </div>
      </dl>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        {t.common.viewDetails}
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
