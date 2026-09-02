export type NotificationType =
  | 'notice_created'
  | 'enrollment_created'
  | 'payment_success'
  | 'payment_failed'
  | 'live_session_scheduled'
  | 'live_session_updated'
  | 'live_session_cancelled'
  | 'live_session_started'
  | 'assignment_created'
  | 'assignment_updated'
  | 'quiz_created'
  | 'quiz_updated'
  | 'course_batch_available'


export interface Notification {
  _id: string
  recipientId: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, any>
  resourceId: string | null
  isRead: boolean
  readAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationPaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface NotificationListResponse {
  success: boolean
  message: string
  meta: NotificationPaginationMeta
  data: Notification[]
}

export interface UnreadCountResponse {
  success: boolean
  message: string
  data: {
    count: number
  }
}

export interface MarkReadResponse {
  success: boolean
  message: string
  data: Notification
}

export interface MarkAllReadResponse {
  success: boolean
  message: string
  data: {
    modifiedCount: number
  }
}

export interface DeleteNotificationResponse {
  success: boolean
  message: string
  data: null
}
