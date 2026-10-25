import { FieldError } from '@/components/form-error'
import { Label } from '@/components/ui/label'

/** Label + control + error with consistent ids for aria-describedby. */
export function FormItem({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className ?? 'space-y-2'}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function ariaFor(id: string, error?: string) {
  return { id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined }
}
