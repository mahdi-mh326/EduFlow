import { apiClient } from './client'
import type {
  Notice,
  CreateNoticePayload,
  UpdateNoticePayload,
  NoticeListResponse,
  NoticeDetailResponse,
} from '@/types/notice'

export const noticeApi = {
  getNotices: async (params?: { courseId?: string; classId?: string; priority?: string }): Promise<Notice[]> => {
    const { data } = await apiClient.get<NoticeListResponse>('/notices', { params })
    return data.data || []
  },

  getNoticeById: async (id: string): Promise<Notice> => {
    const { data } = await apiClient.get<NoticeDetailResponse>(`/notices/${id}`)
    return data.data
  },

  createNotice: async (payload: CreateNoticePayload): Promise<Notice> => {
    const { data } = await apiClient.post<NoticeDetailResponse>('/notices', payload)
    return data.data
  },

  updateNotice: async (id: string, payload: UpdateNoticePayload): Promise<Notice> => {
    const { data } = await apiClient.patch<NoticeDetailResponse>(`/notices/${id}`, payload)
    return data.data
  },

  deleteNotice: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/notices/${id}`)
    return data
  },
}
