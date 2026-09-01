type SkeletonVariant = 'text' | 'rect' | 'circle'

type SkeletonProps = {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
}

const baseClasses = 'animate-pulse rounded-md bg-gray-200'

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-3 w-full rounded',
  rect: 'rounded-lg',
  circle: 'rounded-full',
}

export function Skeleton({ variant = 'rect', width, height, className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width ?? '100%',
    height: height ?? '1rem',
  }

  return <div className={[baseClasses, variantClasses[variant], className].filter(Boolean).join(' ')} style={style} />
}
