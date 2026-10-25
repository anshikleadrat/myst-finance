import { ArrowRight, ClipboardList, ShieldCheck, UserRoundSearch, WalletCards } from 'lucide-react'
import { Fragment } from 'react'
import { useT } from '@/i18n'

const ICONS = [ClipboardList, ShieldCheck, UserRoundSearch, WalletCards]

export function HowItWorksSteps() {
  const t = useT()
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch lg:gap-3">
      {t.howItWorks.steps.map((step, index) => {
        const Icon = ICONS[index]
        return (
          <Fragment key={step.title}>
            <li className="relative flex flex-col items-center rounded-2xl border border-border bg-white px-5 pb-7 pt-10 text-center shadow-sm">
              <span className="absolute -top-5 left-5 flex size-11 items-center justify-center rounded-full border-2 border-dashed border-success bg-white text-sm font-bold text-navy">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="size-8" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
            </li>
            {index < t.howItWorks.steps.length - 1 && (
              <li aria-hidden="true" className="hidden items-center lg:flex">
                <span className="h-px w-3 border-t-2 border-dotted border-primary/40" />
                <ArrowRight className="size-5 text-primary" />
              </li>
            )}
          </Fragment>
        )
      })}
    </ol>
  )
}
