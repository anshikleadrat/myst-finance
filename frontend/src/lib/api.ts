import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: unknown,
  ) {
    super(typeof detail === 'string' ? detail : `API error ${status}`)
  }

  /** FastAPI error code such as `otp_invalid`, or undefined for validation errors. */
  get code(): string | undefined {
    return typeof this.detail === 'string' ? this.detail : undefined
  }

  /** Field -> message map for FastAPI 422 validation errors. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.detail)) return {}
    const errors: Record<string, string> = {}
    for (const item of this.detail as { loc?: unknown[]; msg?: string }[]) {
      const field = item.loc?.at(-1)
      if (typeof field === 'string' && item.msg) errors[field] = item.msg.replace(/^Value error, /, '')
    }
    return errors
  }
}

/**
 * Loaders run during SSR (Node) and on client navigation (browser). On the server we call FastAPI
 * on its internal URL and forward the visitor's cookie; in the browser we use same-origin `/api`
 * (proxied by Vite in dev and Caddy in production) so the session cookie is sent automatically.
 */
const resolveRequest = createIsomorphicFn()
  .server((path: string) => {
    const base = process.env.API_INTERNAL_URL ?? 'http://localhost:8000'
    const cookie = getRequestHeader('cookie')
    return { url: `${base}${path}`, headers: cookie ? { cookie } : ({} as Record<string, string>) }
  })
  .client((path: string) => ({ url: path, headers: {} as Record<string, string> }))

type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }

export async function api<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const { url, headers } = resolveRequest(path)
  const response = await fetch(url, {
    method,
    headers: { Accept: 'application/json', ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  })
  if (response.status === 204) return undefined as T
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new ApiError(response.status, data?.detail ?? response.statusText)
  return data as T
}
