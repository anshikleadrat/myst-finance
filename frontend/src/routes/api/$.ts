import { createFileRoute } from '@tanstack/react-router'
import { getRequestIP } from '@tanstack/react-start/server'

// Hop-by-hop headers must not be forwarded by a proxy (RFC 9110 §7.6.1).
const HOP_BY_HOP = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'host', 'content-length']

/**
 * Forwards `/api/*` to FastAPI so the browser only ever talks to one origin. In production Caddy
 * routes `/api/*` straight to FastAPI and this handler is not hit; it keeps `npm run dev` and a
 * bare `node .output/server/index.mjs` deployment working without an extra proxy.
 */
async function proxy({ request }: { request: Request }) {
  const incoming = new URL(request.url)
  const target = `${process.env.API_INTERNAL_URL ?? 'http://localhost:8000'}${incoming.pathname}${incoming.search}`

  const headers = new Headers(request.headers)
  for (const name of HOP_BY_HOP) headers.delete(name)
  headers.set('x-forwarded-host', incoming.host)
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''))
  const clientIp = getRequestIP({ xForwardedFor: true })
  if (clientIp) headers.set('x-forwarded-for', clientIp)

  const hasBody = !['GET', 'HEAD'].includes(request.method)
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  })

  const responseHeaders = new Headers(upstream.headers)
  for (const name of HOP_BY_HOP) responseHeaders.delete(name)
  responseHeaders.delete('content-encoding') // fetch already decoded the body
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: { GET: proxy, POST: proxy, PUT: proxy, PATCH: proxy, DELETE: proxy },
  },
})
