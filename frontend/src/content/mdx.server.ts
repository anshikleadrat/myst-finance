import type { ComponentType } from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { DocFrontmatter, PostSummary, RenderedDoc } from './mdx'
import type { Locale } from '@/i18n/config'

type MdxModule = { default: ComponentType; frontmatter: DocFrontmatter }

// Eager on the server only: MDX is compiled into the SSR bundle and rendered to HTML there,
// so no MDX runtime or article bodies ship to the browser.
const pages = import.meta.glob<MdxModule>('./pages/*.mdx', { eager: true })
const posts = import.meta.glob<MdxModule>('./blog/*/*.mdx', { eager: true })

function render(module: MdxModule): RenderedDoc {
  return { frontmatter: module.frontmatter, html: renderToStaticMarkup(createElement(module.default)) }
}

export function renderPage(slug: string, locale: Locale): RenderedDoc | null {
  const module = pages[`./pages/${slug}.${locale}.mdx`]
  return module ? render(module) : null
}

export function renderPost(slug: string, locale: Locale): RenderedDoc | null {
  const module = posts[`./blog/${locale}/${slug}.mdx`]
  return module ? render(module) : null
}

export function listPosts(locale: Locale): PostSummary[] {
  return Object.entries(posts)
    .filter(([path]) => path.startsWith(`./blog/${locale}/`))
    .map(([path, module]) => ({ slug: path.split('/').at(-1)!.replace(/\.mdx$/, ''), ...module.frontmatter }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}
