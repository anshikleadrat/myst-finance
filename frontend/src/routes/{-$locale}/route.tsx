import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { defaultLocale, isLocale } from '@/i18n/config'

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    // `/en/...` is not a valid URL (English is unprefixed); unknown prefixes are 404s.
    if (params.locale !== undefined && (!isLocale(params.locale) || params.locale === defaultLocale)) {
      throw notFound()
    }
    return { locale: params.locale ?? defaultLocale }
  },
  component: Outlet,
})
