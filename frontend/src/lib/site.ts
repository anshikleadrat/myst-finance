/** Public origin used for canonical URLs, hreflang, sitemap and Open Graph (set at build time). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const SUPPORT_EMAIL = 'support@mystfinance.in'
export const GRIEVANCE_EMAIL = 'grievance@mystfinance.in'
export const ACCESS_FEE_RUPEES = 199
