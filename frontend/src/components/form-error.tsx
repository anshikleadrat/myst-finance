/** First message from TanStack Form errors (strings or Standard Schema issues) or a server error. */
export function errorMessage(errors: readonly unknown[], serverError?: string): string | undefined {
  for (const error of errors) {
    if (typeof error === 'string' && error) return error
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  }
  return serverError
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
