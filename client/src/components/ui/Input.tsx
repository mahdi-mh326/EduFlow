import { type InputHTMLAttributes, type ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  leftAddon?: ReactNode
  rightAddon?: ReactNode
}

export function Input({
  label,
  error,
  helperText,
  required,
  leftAddon,
  rightAddon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <div className="relative">
        {leftAddon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftAddon}
          </div>
        )}
        <input
          id={inputId}
          className={[
            'w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-colors duration-150',
            'placeholder:text-text-muted',
            leftAddon ? 'pl-10' : '',
            rightAddon ? 'pr-10' : '',
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
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {rightAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {rightAddon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  )
}
