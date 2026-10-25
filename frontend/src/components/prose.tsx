import { cn } from '@/lib/utils'

/** Renders HTML produced on the server from our own MDX files (trusted content). */
export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={cn('prose-myst', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
