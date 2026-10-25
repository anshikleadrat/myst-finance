import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { LanguageSwitcher } from './language-switcher'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useT } from '@/i18n'
import { useSessionUser } from '@/lib/session'
import { useLocaleParams } from '@/lib/use-locale-params'

const navLinkClass =
  'relative py-2 text-[0.95rem] font-medium text-foreground/80 transition-colors hover:text-navy data-[status=active]:text-navy data-[status=active]:after:absolute data-[status=active]:after:inset-x-0 data-[status=active]:after:-bottom-1 data-[status=active]:after:h-0.5 data-[status=active]:after:rounded-full data-[status=active]:after:bg-success'

export function SiteHeader() {
  const t = useT()
  const lp = useLocaleParams()
  const user = useSessionUser()
  const [open, setOpen] = useState(false)

  const links = (
    <>
      <Link to="/{-$locale}" params={lp} activeOptions={{ exact: true }} className={navLinkClass} onClick={() => setOpen(false)}>
        {t.nav.home}
      </Link>
      <Link to="/{-$locale}/how-it-works" params={lp} className={navLinkClass} onClick={() => setOpen(false)}>
        {t.nav.howItWorks}
      </Link>
      <Link to="/{-$locale}/loans" params={lp} className={navLinkClass} onClick={() => setOpen(false)}>
        {t.nav.loanTypes}
      </Link>
      <Link to="/{-$locale}/lenders" params={lp} className={navLinkClass} onClick={() => setOpen(false)}>
        {t.nav.lenders}
      </Link>
      <Link to="/{-$locale}" params={lp} hash="benefits" activeOptions={{ exact: true, includeHash: true }} className={navLinkClass} onClick={() => setOpen(false)}>
        {t.nav.benefits}
      </Link>
      <Link to="/{-$locale}/about" params={lp} className={navLinkClass} onClick={() => setOpen(false)}>
        {t.nav.aboutUs}
      </Link>
    </>
  )

  const account = user ? (
    <Button asChild size="lg" className="rounded-xl px-6">
      <Link to="/{-$locale}/dashboard" params={lp}>
        {t.nav.dashboard}
      </Link>
    </Button>
  ) : (
    <Button asChild size="lg" className="rounded-xl px-7">
      <Link to="/{-$locale}/login" params={lp}>
        {t.nav.login}
      </Link>
    </Button>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-3 focus:py-2">
        {t.nav.skipToContent}
      </a>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link to="/{-$locale}" params={lp} aria-label={t.brand.name}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {links}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          {account}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.nav.menu}>
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="sr-only">{t.nav.menu}</SheetTitle>
              <Logo />
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col gap-2 px-4">
              {links}
            </nav>
            <div className="mt-auto flex flex-col gap-4 p-4">
              <LanguageSwitcher />
              {account}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
