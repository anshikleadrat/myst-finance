import { localeParam } from '@/i18n/config'
import { useLocale } from '@/i18n'

/** `params` for links into `/{-$locale}/...` routes that keep the current language. */
export function useLocaleParams() {
  return { locale: localeParam(useLocale()) }
}
