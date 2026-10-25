import type { Locale } from '@/i18n/config'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('en-IN')

/** ₹1,00,000 (Indian digit grouping). */
export function formatINR(rupees: number): string {
  return inr.format(rupees)
}

export function formatPaise(paise: number): string {
  return formatINR(paise / 100)
}

export function formatNumber(value: number): string {
  return number.format(value)
}

/** ₹55 L / ₹1 Cr style for large amounts; full grouping below one lakh. */
export function formatINRCompact(rupees: number, locale: Locale): string {
  const [lakh, crore] = locale === 'hi' ? ['लाख', 'करोड़'] : ['L', 'Cr']
  const trim = (n: number) => String(Number(n.toFixed(2)))
  if (rupees >= 10_000_000) return `₹${trim(rupees / 10_000_000)} ${crore}`
  if (rupees >= 100_000) return `₹${trim(rupees / 100_000)} ${lakh}`
  return formatINR(rupees)
}

export function formatRateRange(min: number, max: number): string {
  return `${min}% – ${max}%`
}

/** Dates are always shown in IST so server and browser render the same text. */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}
