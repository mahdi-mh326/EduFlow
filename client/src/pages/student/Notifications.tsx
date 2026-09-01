import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, Container, Pagination } from '@/components'
import { notificationApi } from '@/services/api/notification'
import { InboxIcon } from '@/components/ui/icons'
import { getTypeIcon, mapTypeToLabel, formatRelativeTime } from '@/utils/notification'
import { useNotificationStore } from '@/stores/notification.store'
import type { Notification } from '@/types/notification'

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [markingReadId, setMarkingReadId] = useState<string | null>(null)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount)
  const setUnreadCountToZero = useNotificationStore((state) => state.setUnreadCountToZero)

  const loadNotifications = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await notificationApi.getNotifications({ page, limit: 10 })
      setNotifications(result.notifications)
      setMeta(result.meta)
      setCurrentPage(result.meta.page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load notifications. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications(1)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    setMarkingReadId(id)
    try {
      await notificationApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      refreshUnreadCount()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark as read.')
    } finally {
      setMarkingReadId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true)
    try {
      const result = await notificationApi.markAllAsRead()
      await loadNotifications(currentPage)
      setUnreadCountToZero()
      toast.success(`Marked ${result.modifiedCount} notifications as read.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark all as read.')
    } finally {
      setMarkingAllRead(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (loading && notifications.length === 0) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="300px" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <Skeleton variant="circle" width="2.5rem" height="2.5rem" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" height="1rem" width="70%" />
                <Skeleton variant="text" height="0.875rem" width="90%" />
                <Skeleton variant="text" height="0.75rem" width="40%" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (error && notifications.length === 0) {
    return (
      <Container className="py-8">
        <ErrorState
          title="Unable to load notifications"
          message={error}
          onRetry={() => loadNotifications(currentPage)}
          secondaryAction={
            <Button variant="primary" onClick={() => loadNotifications(currentPage)}>
              Retry
            </Button>
          }
        />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-text-muted">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`
              : 'You are all caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => loadNotifications(currentPage)}>
            Refresh
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <InboxIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-semibold text-text">No notifications yet</h3>
          <p className="mt-1 text-sm text-text-muted">
            When you receive notifications, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`rounded-xl border p-4 transition-colors duration-150 ${
                notification.isRead
                  ? 'border-border bg-background'
                  : 'border-primary/20 bg-primary/5'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">{notification.title}</h3>
                        <Badge variant="default" className="bg-primary/10 text-primary">
                          {mapTypeToLabel(notification.type)}
                        </Badge>
                        {!notification.isRead && (
                          <Badge variant="warning" className="bg-accent/10 text-accent">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-text-muted">{notification.message}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification._id)}
                          disabled={markingReadId === notification._id}
                          className="text-xs"
                        >
                          {markingReadId === notification._id ? '...' : 'Mark read'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadNotifications(page)}
          />
        </div>
      )}
    </Container>
  )
}
