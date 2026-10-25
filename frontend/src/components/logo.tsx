import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn('size-9', className)}>
      <path
        d="M5 34V7l15 15L35 7v27"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 34V25M27 34V25" stroke="var(--success)" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-[0.12em] text-navy">MYST</span>
        <span className="text-[0.6rem] font-bold tracking-[0.42em] text-primary">FINANCE</span>
      </span>
    </span>
  )
}
