import { createFileRoute } from '@tanstack/react-router'
import { SITE_URL } from '@/lib/site'

const PRIVATE = ['/login', '/apply', '/checkout', '/dashboard']

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const disallow = ['Disallow: /api/', ...PRIVATE.flatMap((path) => [`Disallow: ${path}`, `Disallow: /hi${path}`])].join('\n')
        const body = `User-agent: *\nAllow: /\n${disallow}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
        return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } })
      },
    },
  },
})
