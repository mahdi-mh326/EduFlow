import { getTypeIcon, formatRelativeTime } from '@/utils/notification'
import type { Notification } from '@/types/notification'

function getAssignmentId(notification: Notification): string | null {
  if (notification.type === 'assignment_created' || notification.type === 'assignment_updated') {
    return notification.data?.assignmentId || notification.resourceId?.split('_').slice(2).join('_') || null
  }
  return null
}

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const assignmentId = getAssignmentId(notification)
  const content = (
    <div
      className={`flex gap-3 rounded-lg border p-3 transition-colors duration-150 ${
        notification.isRead
          ? 'border-border bg-background'
          : 'border-primary/20 bg-primary/5'
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
        {getTypeIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text">{notification.title}</p>
            <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
              {notification.message}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
          {!notification.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          )}
        </div>
      </div>
    </div>
  )

  if (assignmentId && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
      >
        {content}
      </button>
    )
  }

  return content
}
