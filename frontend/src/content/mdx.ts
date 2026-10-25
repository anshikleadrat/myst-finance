import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { locales } from '@/i18n/config'

export type DocFrontmatter = {
  title: string
  description: string
  updated?: string
  date?: string
  readingMinutes?: number
}
export type RenderedDoc = { frontmatter: DocFrontmatter; html: string }
export type PostSummary = DocFrontmatter & { slug: string }

const localeSchema = z.enum(locales)
const docInput = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), locale: localeSchema })

export const getPage = createServerFn({ method: 'GET' })
  .validator(docInput)
  .handler(async ({ data }) => (await import('./mdx.server')).renderPage(data.slug, data.locale))

export const getPost = createServerFn({ method: 'GET' })
  .validator(docInput)
  .handler(async ({ data }) => (await import('./mdx.server')).renderPost(data.slug, data.locale))

export const getPosts = createServerFn({ method: 'GET' })
  .validator(z.object({ locale: localeSchema }))
  .handler(async ({ data }) => (await import('./mdx.server')).listPosts(data.locale))
