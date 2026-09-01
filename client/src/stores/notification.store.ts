import { create } from 'zustand'
import { notificationApi } from '@/services/api/notification'

interface NotificationState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  refreshUnreadCount: () => Promise<void>
  decrementUnreadCount: () => void
  setUnreadCountToZero: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  refreshUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount()
      set({ unreadCount: count })
    } catch {
      // ignore
    }
  },

  decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  setUnreadCountToZero: () => set({ unreadCount: 0 }),
}))
