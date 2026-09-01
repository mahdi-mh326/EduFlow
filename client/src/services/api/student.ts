import { apiClient } from './client'
import type {
  StudentDashboardResponse,
  StudentEnrollment,
  StudentLiveSession,
  StudentAttendance,
  StudentNotice,
} from '@/types/student'

export const studentApi = {
  getDashboard: async (): Promise<StudentDashboardResponse> => {
    const { data } = await apiClient.get('/student/dashboard')
    return data.data
  },

  getLiveSessions: async (): Promise<StudentLiveSession[]> => {
    const { data } = await apiClient.get('/student/live-sessions')
    return data.data
  },

  getAttendance: async (params?: { page?: number; limit?: number }): Promise<{
    meta: { total: number; page: number; limit: number; totalPages: number }
    data: StudentAttendance[]
  }> => {
    const { data } = await apiClient.get('/student/attendance', { params })
    return {
      meta: data.meta,
      data: data.data,
    }
  },

  getNotices: async (): Promise<StudentNotice[]> => {
    const { data } = await apiClient.get('/notices')
    return data.data
  },

  getEnrollments: async (): Promise<StudentEnrollment[]> => {
    const { data } = await apiClient.get('/enrollments')
    return data.data
  },
}
