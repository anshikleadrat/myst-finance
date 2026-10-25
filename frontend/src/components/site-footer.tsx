import { Link } from '@tanstack/react-router'
import { Logo } from './logo'
import { LOAN_TYPE_PAGES } from '@/content/loan-types'
import { useLocale, useT } from '@/i18n'
import { SUPPORT_EMAIL } from '@/lib/site'
import { useLocaleParams } from '@/lib/use-locale-params'

const linkClass = 'text-sm text-white/75 transition-colors hover:text-white'

export function SiteFooter() {
  const t = useT()
  const locale = useLocale()
  const lp = useLocaleParams()

  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="inline-block rounded-xl bg-white px-3 py-2">
            <Logo />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">{t.footer.about}</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 inline-block text-sm font-medium text-white underline-offset-4 hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <nav aria-label={t.footer.loans}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{t.footer.loans}</h2>
          <ul className="space-y-2">
            {LOAN_TYPE_PAGES.map((page) => (
              <li key={page.slug}>
                <Link to="/{-$locale}/loans/$slug" params={{ ...lp, slug: page.slug }} className={linkClass}>
                  {page.content[locale].name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/{-$locale}/lenders" params={lp} className={linkClass}>
                {t.nav.lenders}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t.footer.resources}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{t.footer.resources}</h2>
          <ul className="space-y-2">
            <li><Link to="/{-$locale}/emi-calculator" params={lp} className={linkClass}>{t.nav.emiCalculator}</Link></li>
            <li><Link to="/{-$locale}/blog" params={lp} className={linkClass}>{t.nav.blog}</Link></li>
            <li><Link to="/{-$locale}/how-it-works" params={lp} className={linkClass}>{t.nav.howItWorks}</Link></li>
            <li><Link to="/{-$locale}/faq" params={lp} className={linkClass}>{t.nav.faq}</Link></li>
            <li><Link to="/{-$locale}/about" params={lp} className={linkClass}>{t.nav.aboutUs}</Link></li>
            <li><Link to="/{-$locale}/contact" params={lp} className={linkClass}>{t.nav.contact}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t.footer.legal}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{t.footer.legal}</h2>
          <ul className="space-y-2">
            <li><Link to="/{-$locale}/terms" params={lp} className={linkClass}>{t.footer.terms}</Link></li>
            <li><Link to="/{-$locale}/privacy" params={lp} className={linkClass}>{t.footer.privacy}</Link></li>
            <li><Link to="/{-$locale}/refund-policy" params={lp} className={linkClass}>{t.footer.refund}</Link></li>
            <li><Link to="/{-$locale}/disclaimer" params={lp} className={linkClass}>{t.footer.disclaimer}</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-6 text-xs leading-5 text-white/60 sm:px-6">
          <p>{t.disclaimer.long}</p>
          <p>{t.footer.rights(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  )
}
