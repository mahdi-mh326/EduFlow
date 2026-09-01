import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border border-slate-200/60',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  secondary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200/60',
  error: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200/60',
}


type BadgeProps = {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
