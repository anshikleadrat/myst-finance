import { Check } from 'lucide-react'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

export const STEPS = ['personal', 'employment', 'loan', 'review'] as const
export type Step = (typeof STEPS)[number]

export function Stepper({ current, completed, onSelect }: { current: Step; completed: Step[]; onSelect: (step: Step) => void }) {
  const t = useT()
  const currentIndex = STEPS.indexOf(current)
  return (
    <nav aria-label={t.apply.stepOf(currentIndex + 1, STEPS.length)}>
      <p className="mb-3 text-sm text-muted-foreground lg:hidden">{t.apply.stepOf(currentIndex + 1, STEPS.length)}</p>
      <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {STEPS.map((step, index) => {
          const done = completed.includes(step) && step !== current
          const active = step === current
          const reachable = index <= currentIndex || STEPS.slice(0, index).every((s) => completed.includes(s))
          return (
            <li key={step} className="shrink-0">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(step)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors',
                  active ? 'bg-secondary text-primary' : 'text-muted-foreground',
                  reachable && !active && 'hover:bg-muted hover:text-foreground',
                  !reachable && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                    active && 'border-primary bg-primary text-white',
                    done && 'border-success text-success',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{t.apply.steps[index]}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
