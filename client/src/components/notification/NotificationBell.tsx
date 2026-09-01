import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components'
import { BellIcon } from '@/components/ui/icons'
import { NotificationDropdown } from './NotificationDropdown'
import { useNotificationStore } from '@/stores/notification.store'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    refreshUnreadCount()
  }, [refreshUnreadCount])

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : ''

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="relative p-2"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        title="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            {displayCount}
          </span>
        )}
      </Button>

      <NotificationDropdown open={open} onClose={handleClose} />
    </div>
  )
}
