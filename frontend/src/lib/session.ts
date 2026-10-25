import { redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { auth } from './endpoints'
import type { User } from './types'
import { localeParam, type Locale } from '@/i18n/config'

const isBrowser = typeof window !== 'undefined'
let cached: Promise<User | null> | null = null
const listeners = new Set<() => void>()

async function loadUser(): Promise<User | null> {
  return (await auth.session()).user
}

/** Current user or null. Cached in the browser; always fresh during SSR (per request). */
export function fetchSession(): Promise<User | null> {
  if (!isBrowser) return loadUser()
  cached ??= loadUser().catch((error) => {
    cached = null
    throw error
  })
  return cached
}

/** Call after login, logout, payment or profile changes. */
export function invalidateSession(): void {
  cached = null
  for (const listener of listeners) listener()
}

/** Guard for `beforeLoad`: returns the user or redirects to login with a return path. */
export async function requireUser(locale: Locale, returnTo: string): Promise<User> {
  const user = await fetchSession()
  if (!user) {
    throw redirect({ to: '/{-$locale}/login', params: { locale: localeParam(locale) }, search: { redirect: returnTo } })
  }
  return user
}

/** Client-side session for public pages (header login state). `undefined` while unknown. */
export function useSessionUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => {
    let active = true
    const load = () => {
      fetchSession()
        .then((value) => active && setUser(value))
        .catch(() => active && setUser(null))
    }
    load()
    listeners.add(load)
    return () => {
      active = false
      listeners.delete(load)
    }
  }, [])
  return user
}

/** Only allow same-site relative redirects after login. */
export function safeRedirect(target: string | undefined): string | undefined {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : undefined
}
