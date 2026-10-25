import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { DashboardNav } from '@/components/dashboard/sidebar'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useT } from '@/i18n'
import { requireUser } from '@/lib/session'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_app')({
  beforeLoad: async ({ context, location }) => ({ user: await requireUser(context.locale, location.href) }),
  component: AppLayout,
})

function AppLayout() {
  const t = useT()
  const lp = useLocaleParams()
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-muted lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-white px-4 py-6 lg:block">
        <DashboardNav />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <Link to="/{-$locale}" params={lp} aria-label={t.brand.name}>
          <Logo />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t.nav.menu}>
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 px-4 py-6">
            <SheetTitle className="sr-only">{t.nav.menu}</SheetTitle>
            <DashboardNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
