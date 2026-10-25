import { cn } from '@/lib/utils'

const PALETTE = ['#0b40b8', '#1f9d55', '#7c3aed', '#c2410c', '#0e7490', '#be185d', '#4d7c0f', '#1d4ed8']

/** Initials avatar. We do not reproduce lender logos (trademarks) without permission. */
export function LenderAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  const hue = PALETTE[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length]
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white', className)}
      style={{ backgroundColor: hue }}
    >
      {initials}
    </span>
  )
}
