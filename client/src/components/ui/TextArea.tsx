import { type TextareaHTMLAttributes } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export function TextArea({
  label,
  error,
  helperText,
  required,
  className = '',
  id,
  ...props
}: TextAreaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={[
          'w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-colors duration-150 resize-y',
          'placeholder:text-text-muted',
          error
            ? 'border-error focus:border-error focus:ring-error'
            : 'border-border focus:border-primary focus:ring-primary',
          'focus:ring-2 focus:ring-offset-0',
          'disabled:bg-background disabled:text-text-muted disabled:pointer-events-none',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  )
}
