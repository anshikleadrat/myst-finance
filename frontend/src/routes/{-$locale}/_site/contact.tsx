import { Link, createFileRoute } from '@tanstack/react-router'
import { Clock, LifeBuoy, Mail, Scale } from 'lucide-react'
import { PageHero } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { getMessages, useT } from '@/i18n'
import { localeFrom, seo } from '@/lib/seo'
import { GRIEVANCE_EMAIL, SUPPORT_EMAIL } from '@/lib/site'
import { useLocaleParams } from '@/lib/use-locale-params'

export const Route = createFileRoute('/{-$locale}/_site/contact')({
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({
      locale,
      path: '/contact',
      title: t.contact.metaTitle,
      description: t.contact.metaDescription,
      jsonLd: {
        '@type': 'ContactPage',
        name: t.contact.title,
        mainEntity: {
          '@type': 'Organization',
          name: 'MYST Finance',
          contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: SUPPORT_EMAIL, availableLanguage: ['English', 'Hindi'] }],
        },
      },
    })
  },
  component: ContactPage,
})

function ContactPage() {
  const t = useT()
  const lp = useLocaleParams()
  const cards = [
    { icon: Mail, title: t.contact.emailTitle, body: <a className="font-medium text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> },
    { icon: Clock, title: t.contact.hoursTitle, body: t.contact.hours },
    {
      icon: LifeBuoy,
      title: t.contact.supportTitle,
      body: (
        <>
          <p>{t.contact.supportBody}</p>
          <Button asChild variant="outline" className="mt-4 rounded-xl">
            <Link to="/{-$locale}/dashboard/support" params={lp}>{t.contact.supportCta}</Link>
          </Button>
        </>
      ),
    },
    {
      icon: Scale,
      title: t.contact.grievanceTitle,
      body: (
        <>
          <p>{t.contact.grievanceBody}</p>
          <a className="mt-2 inline-block font-medium text-primary hover:underline" href={`mailto:${GRIEVANCE_EMAIL}`}>{GRIEVANCE_EMAIL}</a>
        </>
      ),
    },
  ]
  return (
    <>
      <PageHero title={t.contact.title} subtitle={t.contact.subtitle} />
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6">
        {cards.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{body}</div>
          </div>
        ))}
      </section>
    </>
  )
}
