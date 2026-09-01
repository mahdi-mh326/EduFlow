import { Link } from 'react-router-dom'
import { Badge, Card } from '@/components'
import { ClockIcon } from '@/components/ui/icons'
import type { CourseResponse } from '@/services/api/course'
import { formatCurrency, getImageUrl } from '@/utils'

type CourseCardProps = {
  course: CourseResponse
}

const fallbackGradients = [
  'from-primary/20 to-primary/5',
  'from-secondary/20 to-secondary/5',
  'from-accent/30 to-accent/5',
]

function getGradient(category: string) {
  const index = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % fallbackGradients.length
  return fallbackGradients[index]
}

function formatDuration(value: number, unit: string) {
  if (!Number.isFinite(value) || !unit) return 'Duration N/A'
  return `${value} ${unit}${value === 1 ? '' : 's'}`
}

export function CourseCard({ course }: CourseCardProps) {
  const hasOffer = typeof course.offerPrice === 'number' && course.offerPrice < course.price
  const imageUrl = getImageUrl(course.thumbnail)


  return (
    <Card variant="bordered" className="flex h-full flex-col overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`relative h-40 bg-gradient-to-br ${getGradient(course.category)}`}>
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="text-4xl font-semibold text-primary/40">{course.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant="default" className="bg-white/90 text-text">
            {course.category || 'Course'}
          </Badge>
        </div>
        {hasOffer && (
          <div className="absolute right-3 top-3">
            <Badge variant="warning" className="bg-accent text-text">Offer</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-semibold text-text">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-text-muted">{course.shortDescription || 'Course description not available.'}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {formatDuration(course.durationValue, course.durationUnit)}
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 capitalize ring-1 ring-border">
            {course.difficulty || 'Level N/A'}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {hasOffer ? (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-lg font-bold text-text">{formatCurrency(course.offerPrice)}</span>
                <span className="text-sm text-text-muted line-through">{formatCurrency(course.price)}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-text">{formatCurrency(course.price)}</span>
            )}
          </div>
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            View Course
          </Link>
        </div>
      </div>
    </Card>
  )
}
