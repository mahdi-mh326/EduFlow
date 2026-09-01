import { SpinnerIcon } from './icons'

type LoadingSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<LoadingSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

type LoadingProps = {
  size?: LoadingSize
  centered?: boolean
  fullScreen?: boolean
  label?: string
}

export function Loading({ size = 'md', centered = false, fullScreen = false, label }: LoadingProps) {
  const content = (
    <div className="flex items-center gap-3 text-text-muted" role="status" aria-live="polite">
      <SpinnerIcon className={`${sizeClasses[size]} animate-spin`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )

  if (fullScreen) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">{content}</div>
  }

  if (centered) {
    return <div className="flex items-center justify-center py-12">{content}</div>
  }

  return <div className="inline-flex items-center gap-3">{content}</div>
}
