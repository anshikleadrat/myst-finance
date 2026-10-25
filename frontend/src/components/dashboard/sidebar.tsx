import { Link, useNavigate } from '@tanstack/react-router'
import { CreditCard, FileText, LayoutDashboard, LifeBuoy, ListChecks, LogOut, UserRound } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { useT } from '@/i18n'
import { auth } from '@/lib/endpoints'
import { invalidateSession } from '@/lib/session'
import { useLocaleParams } from '@/lib/use-locale-params'

const itemClass =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary'

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT()
  const lp = useLocaleParams()
  const navigate = useNavigate()
  const n = t.dashboard.nav

  const logout = async () => {
    try {
      await auth.logout()
    } finally {
      invalidateSession()
      await navigate({ to: '/{-$locale}', params: lp })
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Link to="/{-$locale}" params={lp} className="px-3" aria-label={t.brand.name}>
        <Logo />
      </Link>
      <nav aria-label={n.dashboard} className="mt-8 flex flex-col gap-1">
        <Link to="/{-$locale}/dashboard" params={lp} activeOptions={{ exact: true }} className={itemClass} onClick={onNavigate}>
          <LayoutDashboard className="size-5" aria-hidden="true" /> {n.dashboard}
        </Link>
        <Link to="/{-$locale}/dashboard/applications" params={lp} className={itemClass} onClick={onNavigate}>
          <FileText className="size-5" aria-hidden="true" /> {n.applications}
        </Link>
        <Link to="/{-$locale}/dashboard/lenders" params={lp} className={itemClass} onClick={onNavigate}>
          <ListChecks className="size-5" aria-hidden="true" /> {n.lenders}
        </Link>
        <Link to="/{-$locale}/dashboard/payments" params={lp} className={itemClass} onClick={onNavigate}>
          <CreditCard className="size-5" aria-hidden="true" /> {n.payments}
        </Link>
        <Link to="/{-$locale}/dashboard/profile" params={lp} className={itemClass} onClick={onNavigate}>
          <UserRound className="size-5" aria-hidden="true" /> {n.profile}
        </Link>
        <Link to="/{-$locale}/dashboard/support" params={lp} className={itemClass} onClick={onNavigate}>
          <LifeBuoy className="size-5" aria-hidden="true" /> {n.support}
        </Link>
        <button type="button" onClick={logout} className={itemClass}>
          <LogOut className="size-5" aria-hidden="true" /> {n.logout}
        </button>
      </nav>
      <div className="mt-auto px-3 pt-8">
        <LanguageSwitcher />
      </div>
    </div>
  )
}
