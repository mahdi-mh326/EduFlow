import { type ReactNode } from 'react'
import { AlertCircleIcon } from './icons'
import { Button } from './Button'

type ErrorStateProps = {
  title: string
  message?: string
  onRetry?: () => void
  secondaryAction?: ReactNode
}

export function ErrorState({ title, message, onRetry, secondaryAction }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-error">
        <AlertCircleIcon className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-text-muted">{message}</p>}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Retry
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  )
}
