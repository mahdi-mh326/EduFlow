import { type ReactNode } from 'react'

type CardVariant = 'default' | 'bordered' | 'elevated'

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface',
  bordered: 'bg-surface border border-border',
  elevated: 'bg-surface shadow-md',
}

type CardProps = {
  variant?: CardVariant
  className?: string
  children: ReactNode
}

type CardSectionProps = {
  className?: string
  children: ReactNode
}

export function Card({ variant = 'default', className = '', children }: CardProps) {
  return <div className={`rounded-xl ${variantClasses[variant]} ${className}`}>{children}</div>
}

Card.Header = function CardHeader({ className = '', children }: CardSectionProps) {
  return <div className={`px-5 py-4 border-b border-border ${className}`}>{children}</div>
}

Card.Content = function CardContent({ className = '', children }: CardSectionProps) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

Card.Footer = function CardFooter({ className = '', children }: CardSectionProps) {
  return <div className={`px-5 py-4 border-t border-border ${className}`}>{children}</div>
}
