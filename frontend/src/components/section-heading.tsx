import { cn } from '@/lib/utils'

export function SectionHeading({
  title,
  subtitle,
  as: Tag = 'h2',
  align = 'center',
  className,
}: {
  title: string
  subtitle?: string
  as?: 'h1' | 'h2'
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      <Tag className={cn('font-bold', Tag === 'h1' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl')}>{title}</Tag>
      {subtitle && <p className="mt-3 text-base leading-7 text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-muted to-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeading as="h1" title={title} subtitle={subtitle} align="left" />
        {children}
      </div>
    </section>
  )
}
