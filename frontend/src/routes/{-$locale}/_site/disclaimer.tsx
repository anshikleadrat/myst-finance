import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocPage, docHead } from '@/components/doc-page'
import { getPage } from '@/content/mdx'
import { localeFrom } from '@/lib/seo'

export const Route = createFileRoute('/{-$locale}/_site/disclaimer')({
  loader: async ({ params }) => {
    const doc = await getPage({ data: { slug: 'disclaimer', locale: localeFrom(params.locale) } })
    if (!doc) throw notFound()
    return doc
  },
  head: ({ params, loaderData }) => docHead('disclaimer', params.locale, loaderData),
  component: () => <DocPage doc={Route.useLoaderData()} />,
})
