import { useLocation } from '@tanstack/react-router'
import { Languages } from 'lucide-react'
import { localeMeta, localizePath, locales, unlocalizePath } from '@/i18n/config'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

/** Plain links (full navigation) so the document `lang` and all head tags switch together. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale()
  const { pathname, searchStr } = useLocation()
  const basePath = unlocalizePath(pathname)

  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
      {locales.map((locale) => (
        <a
          key={locale}
          href={`${localizePath(basePath, locale)}${searchStr}`}
          hrefLang={localeMeta[locale].hrefLang}
          lang={localeMeta[locale].htmlLang}
          aria-current={locale === current ? 'true' : undefined}
          className={cn(
            'rounded-md px-2 py-1 font-medium transition-colors',
            locale === current ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {localeMeta[locale].label}
        </a>
      ))}
    </div>
  )
}
