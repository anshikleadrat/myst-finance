import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { useLocaleParams } from '@/lib/use-locale-params'

function StatusLayout({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <div className="mt-8">{action}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function NotFoundPage() {
  const t = useT()
  const lp = useLocaleParams()
  return (
    <StatusLayout
      title={t.notFound.title}
      body={t.notFound.body}
      action={
        <Button asChild size="lg">
          <Link to="/{-$locale}" params={lp}>
            {t.notFound.home}
          </Link>
        </Button>
      }
    />
  )
}

export function ErrorPage({ error }: ErrorComponentProps) {
  const t = useT()
  const router = useRouter()
  if (import.meta.env.DEV) console.error(error)
  return (
    <StatusLayout
      title={t.errorPage.title}
      body={t.errorPage.body}
      action={
        <Button size="lg" onClick={() => router.invalidate()}>
          {t.errorPage.retry}
        </Button>
      }
    />
  )
}
