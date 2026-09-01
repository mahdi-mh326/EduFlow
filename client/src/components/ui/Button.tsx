import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/95 shadow-sm shadow-primary/20 active:scale-[0.99] focus-visible:ring-primary',
  secondary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-[0.99] focus-visible:ring-indigo-600',
  outline: 'border border-border bg-surface text-text hover:bg-slate-50 hover:border-slate-300 shadow-xs focus-visible:ring-primary',
  ghost: 'bg-transparent text-text hover:bg-slate-100/80 focus-visible:ring-primary',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 active:scale-[0.99] focus-visible:ring-rose-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-[0.99] focus-visible:ring-emerald-600',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs font-medium rounded-lg',
  md: 'h-10 px-4 text-sm font-medium rounded-xl',
  lg: 'h-11 px-5 text-sm font-semibold rounded-xl',
}


type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {children}
    </button>
  )
}
