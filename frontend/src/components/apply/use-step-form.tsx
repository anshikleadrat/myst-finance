import { useState } from 'react'
import { ApiError } from '@/lib/api'
import { useT } from '@/i18n'

/** Shared server-error handling for application steps: field errors from 422s, a banner otherwise. */
export function useServerErrors() {
  const t = useT()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()

  const capture = (error: unknown) => {
    if (error instanceof ApiError && error.status === 422) {
      setFieldErrors(error.fieldErrors)
      setFormError(Object.keys(error.fieldErrors).length ? undefined : t.common.errorGeneric)
    } else if (error instanceof ApiError && error.status === 409) {
      setFormError(t.apply.alreadySubmitted)
    } else {
      setFormError(error instanceof TypeError ? t.common.errorNetwork : t.common.errorGeneric)
    }
  }
  const reset = () => {
    setFieldErrors({})
    setFormError(undefined)
  }
  return { fieldErrors, formError, capture, reset }
}

export function FormBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </p>
  )
}
