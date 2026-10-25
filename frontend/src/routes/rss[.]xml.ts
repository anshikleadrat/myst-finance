import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async () => {
        const { buildRss } = await import('@/lib/sitemap.server')
        return new Response(buildRss(), {
          headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
        })
      },
    },
  },
})
