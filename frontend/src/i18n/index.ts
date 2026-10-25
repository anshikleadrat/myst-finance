import { useParams } from '@tanstack/react-router'
import { defaultLocale, isLocale, type Locale } from './config'
import { en, type Messages } from './en'
import { hi } from './hi'

const messages: Record<Locale, Messages> = { en, hi }

export function getMessages(locale: Locale): Messages {
  return messages[locale]
}

/** Current locale from the optional `{-$locale}` path param (English when absent). */
export function useLocale(): Locale {
  const { locale } = useParams({ strict: false })
  return isLocale(locale) ? locale : defaultLocale
}

export function useT(): Messages {
  return getMessages(useLocale())
}

export type { Locale, Messages }
