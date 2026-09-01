import { apiClient } from './client'
import type { Notification, NotificationType, NotificationPaginationMeta } from '@/types/notification'

export interface NotificationsQuery {
  page?: number
  limit?: number
  type?: NotificationType
}

export interface NotificationsResult {
  meta: NotificationPaginationMeta
  notifications: Notification[]
}

export const notificationApi = {
  getNotifications: async (query: NotificationsQuery = {}): Promise<NotificationsResult> => {
    const { data } = await apiClient.get('/notifications', { params: query })
    return {
      meta: data.meta,
      notifications: data.data,
    }
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread-count')
    return data.data.count
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.patch(`/notifications/${id}/read`)
    return data.data
  },

  markAllAsRead: async (): Promise<{ modifiedCount: number }> => {
    const { data } = await apiClient.patch('/notifications/read-all')
    return data.data
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`)
  },
}
