import { Outlet, createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/lib/session'

/** Pages inside the public site chrome that need a logged-in user (apply, checkout). */
export const Route = createFileRoute('/{-$locale}/_site/_auth')({
  beforeLoad: async ({ context, location }) => ({ user: await requireUser(context.locale, location.href) }),
  component: Outlet,
})
