import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DisclaimerNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('flex gap-2 rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
