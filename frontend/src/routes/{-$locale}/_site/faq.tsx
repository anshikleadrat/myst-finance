import { createFileRoute } from '@tanstack/react-router'
import { FaqList } from '@/components/faq-list'
import { PageHero } from '@/components/section-heading'
import { FAQ } from '@/content/faq'
import { getMessages, useLocale, useT } from '@/i18n'
import { ld, localeFrom, seo } from '@/lib/seo'

export const Route = createFileRoute('/{-$locale}/_site/faq')({
  head: ({ params }) => {
    const locale = localeFrom(params.locale)
    const t = getMessages(locale)
    return seo({ locale, path: '/faq', title: t.faq.metaTitle, description: t.faq.metaDescription, jsonLd: ld.faq(FAQ[locale]) })
  },
  component: FaqPage,
})

function FaqPage() {
  const t = useT()
  const locale = useLocale()
  return (
    <>
      <PageHero title={t.faq.title} />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <FaqList items={FAQ[locale]} />
      </section>
    </>
  )
}
