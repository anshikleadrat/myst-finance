import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'

export function StepActions({ onBack, submitting, submitLabel }: { onBack?: () => void; submitting: boolean; submitLabel?: string }) {
  const t = useT()
  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      {onBack ? (
        <Button type="button" variant="outline" size="lg" className="h-12 min-w-28 rounded-xl" onClick={onBack}>
          {t.common.back}
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" size="lg" className="h-12 min-w-40 flex-1 rounded-xl text-base sm:flex-none sm:px-14" disabled={submitting}>
        {submitting ? t.common.saving : (submitLabel ?? t.common.next)}
      </Button>
    </div>
  )
}
