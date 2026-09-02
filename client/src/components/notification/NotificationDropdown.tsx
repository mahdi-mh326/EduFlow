import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Skeleton, ErrorState } from '@/components'
import { notificationApi } from '@/services/api/notification'
import { InboxIcon, XIcon } from '@/components/ui/icons'
import type { Notification } from '@/types/notification'
import { useNotificationStore } from '@/stores/notification.store'
import { useAuthStore } from '@/stores/auth.store'
import { NotificationItem } from './NotificationItem'


interface NotificationDropdownProps {
  open: boolean
  onClose: () => void
}

export function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const decrementUnreadCount = useNotificationStore((state) => state.decrementUnreadCount)
  const setUnreadCountToZero = useNotificationStore((state) => state.setUnreadCountToZero)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [notificationsResult] = await Promise.all([
        notificationApi.getNotifications({ page: 1, limit: 5 }),
      ])
      setNotifications(notificationsResult.notifications)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load notifications.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open, loadNotifications])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const dropdown = document.querySelector('[data-notification-dropdown]')
      if (dropdown && !dropdown.contains(target)) {
        onClose()
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      decrementUnreadCount()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark as read.')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCountToZero()
      toast.success(`Marked ${result.modifiedCount} notifications as read.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark all as read.')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await notificationApi.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n._id !== id))
      toast.success('Notification deleted.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete notification.')
    }
  }

  const user = useAuthStore((state) => state.user)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (!open) return null

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'course_batch_available') {
      const slugOrId = notification.data?.courseSlug || notification.data?.courseId
      if (slugOrId) {
        navigate(`/courses/${slugOrId}`)
        onClose()
      }
    } else if (
      notification.type === 'assignment_created' ||
      notification.type === 'assignment_updated'
    ) {
      const assignmentId =
        notification.data?.assignmentId ||
        notification.resourceId?.split('_').slice(2).join('_')
      if (assignmentId) {
        navigate(`/student/assignments/${assignmentId}`)
        onClose()
      }
    } else if (
      notification.type === 'live_session_scheduled' ||
      notification.type === 'live_session_started' ||
      notification.type === 'live_session_updated'
    ) {
      navigate('/student/live-classes')
      onClose()
    } else if (notification.type === 'notice_created') {
      navigate('/student/notices')
      onClose()
    }
  }

  const viewAllLink =
    user?.role === 'teacher'
      ? '/teacher/notices'
      : user?.role === 'admin'
      ? '/admin/notices'
      : '/student/notifications'

  return (
    <div
      data-notification-dropdown
      className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl border border-border bg-surface shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
        <div>
          <h3 className="text-sm font-semibold text-text">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-text-muted">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-background hover:text-text"
            aria-label="Close notifications"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-12rem)] sm:max-h-96 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton variant="circle" width="2rem" height="2rem" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" height="0.875rem" width="80%" />
                  <Skeleton variant="text" height="0.75rem" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Failed to load"
              message={error}
              onRetry={loadNotifications}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <InboxIcon className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-text">No notifications yet</p>
            <p className="text-xs text-text-muted">You're all caught up!</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {notifications.map((notification) => (
              <div key={notification._id} className="relative group">
                <NotificationItem
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-surface/90 backdrop-blur-xs rounded-lg p-0.5 shadow-xs">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="text-xs h-7 px-2"
                    >
                      Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(notification._id, e)}
                    className="text-xs text-error hover:text-error h-7 w-7 p-0 flex items-center justify-center"
                    aria-label="Delete notification"
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-border p-2 bg-surface">
          <Link to={viewAllLink} onClick={onClose} className="block">
            <Button variant="ghost" fullWidth size="sm">
              View all notifications
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

