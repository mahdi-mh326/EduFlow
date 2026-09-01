import type { NotificationType } from '@/types/notification'
import { BookOpenIcon, CheckCircleIcon, AlertCircleIcon, UsersIcon, MonitorIcon, AwardIcon, BellIcon } from '@/components/ui/icons'

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'notice_created':
      return <BookOpenIcon className="h-4 w-4 text-primary" />
    case 'enrollment_created':
      return <CheckCircleIcon className="h-4 w-4 text-success" />
    case 'payment_success':
      return <AwardIcon className="h-4 w-4 text-success" />
    case 'payment_failed':
      return <AlertCircleIcon className="h-4 w-4 text-error" />
    case 'live_session_scheduled':
    case 'live_session_updated':
    case 'live_session_started':
      return <MonitorIcon className="h-4 w-4 text-secondary" />
    case 'live_session_cancelled':
      return <AlertCircleIcon className="h-4 w-4 text-error" />
    case 'assignment_created':
    case 'assignment_updated':
      return <BookOpenIcon className="h-4 w-4 text-accent" />
    case 'quiz_created':
    case 'quiz_updated':
      return <UsersIcon className="h-4 w-4 text-primary" />
    default:
      return <BellIcon className="h-4 w-4 text-text-muted" />
  }
}

export function mapTypeToLabel(type: NotificationType): string {
  switch (type) {
    case 'notice_created':
      return 'Notice'
    case 'enrollment_created':
      return 'Enrollment'
    case 'payment_success':
      return 'Payment'
    case 'payment_failed':
      return 'Payment'
    case 'live_session_scheduled':
      return 'Live Class'
    case 'live_session_updated':
      return 'Live Class'
    case 'live_session_cancelled':
      return 'Live Class'
    case 'live_session_started':
      return 'Live Class'
    case 'assignment_created':
      return 'Assignment'
    case 'assignment_updated':
      return 'Assignment'
    case 'quiz_created':
      return 'Quiz'
    case 'quiz_updated':
      return 'Quiz'
    default:
      return 'Notification'
  }
}
