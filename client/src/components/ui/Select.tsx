import { type SelectHTMLAttributes } from 'react'

type Option = { value: string; label: string; disabled?: boolean }

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options: Option[]
  error?: string
  required?: boolean
  placeholder?: string
}

export function Select({
  label,
  options,
  error,
  required,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={[
          'w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-colors duration-150',
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
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  )
}
