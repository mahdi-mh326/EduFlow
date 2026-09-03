import { apiClient } from './client'
import type {
  AdminCourse,
  AdminClass,
  AdminTeacher,
  AdminStudent,
  AdminEnrollment,
  AdminPayment,
  AdminCreateCoursePayload,
  AdminUpdateCoursePayload,
  AdminCreateClassPayload,
  AdminUpdateClassPayload,
  AdminCreateTeacherPayload,
  AdminUpdateTeacherPayload,
  AdminCreateAdminPayload,
  AdminListResponse,
  AdminDetailResponse,
} from '@/types/admin'

export const adminApi = {
  getCourses: async (params?: { page?: number; limit?: number; search?: string; category?: string; difficulty?: string; featured?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<AdminListResponse<AdminCourse>> => {
    const { data } = await apiClient.get('/courses', { params })
    return data
  },

  getCourseBySlug: async (slug: string): Promise<AdminDetailResponse<AdminCourse>> => {
    const { data } = await apiClient.get(`/courses/${slug}`)
    return data
  },

  createCourse: async (payload: AdminCreateCoursePayload): Promise<AdminDetailResponse<AdminCourse>> => {
    const { data } = await apiClient.post('/courses', payload)
    return data
  },

  updateCourse: async (id: string, payload: AdminUpdateCoursePayload): Promise<AdminDetailResponse<AdminCourse>> => {
    const { data } = await apiClient.patch(`/courses/${id}`, payload)
    return data
  },

  publishCourse: async (id: string): Promise<AdminDetailResponse<AdminCourse>> => {
    const { data } = await apiClient.patch(`/courses/${id}/publish`)
    return data
  },

  featureCourse: async (id: string): Promise<AdminDetailResponse<AdminCourse>> => {
    const { data } = await apiClient.patch(`/courses/${id}/feature`)
    return data
  },

  deleteCourse: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/courses/${id}`)
    return data
  },

  uploadCoursePoster: async (file: File, courseId?: string): Promise<{ posterUrl: string }> => {
    const formData = new FormData()
    formData.append('poster', file)
    const url = courseId ? `/courses/${courseId}/poster` : `/courses/upload-poster`
    const { data } = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  deleteCoursePoster: async (courseId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/courses/${courseId}/poster`)
    return data
  },


  getClasses: async (params?: { page?: number; limit?: number; search?: string; courseId?: string; teacherId?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<AdminListResponse<AdminClass>> => {
    const { data } = await apiClient.get('/classes', { params })
    return data
  },

  getClassById: async (id: string): Promise<AdminDetailResponse<AdminClass>> => {
    const { data } = await apiClient.get(`/classes/${id}`)
    return data
  },

  createClass: async (payload: AdminCreateClassPayload): Promise<AdminDetailResponse<AdminClass>> => {
    const { data } = await apiClient.post('/classes', payload)
    return data
  },

  updateClass: async (id: string, payload: AdminUpdateClassPayload): Promise<AdminDetailResponse<AdminClass>> => {
    const { data } = await apiClient.patch(`/classes/${id}`, payload)
    return data
  },

  deleteClass: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/classes/${id}`)
    return data
  },

  getTeachers: async (params?: { page?: number; limit?: number; search?: string; status?: string; gender?: string; sortBy?: string; sortOrder?: string }): Promise<AdminListResponse<AdminTeacher>> => {
    const { data } = await apiClient.get('/teachers', { params })
    return data
  },

  getTeacherById: async (id: string): Promise<AdminDetailResponse<AdminTeacher>> => {
    const { data } = await apiClient.get(`/teachers/${id}`)
    return data
  },

  createTeacher: async (payload: AdminCreateTeacherPayload): Promise<AdminDetailResponse<AdminTeacher>> => {
    const { data } = await apiClient.post('/teachers', payload)
    return data
  },

  updateTeacher: async (id: string, payload: AdminUpdateTeacherPayload): Promise<AdminDetailResponse<AdminTeacher>> => {
    const { data } = await apiClient.patch(`/teachers/${id}`, payload)
    return data
  },

  updateTeacherStatus: async (id: string, status: 'active' | 'blocked'): Promise<AdminDetailResponse<AdminTeacher>> => {
    const { data } = await apiClient.patch(`/teachers/${id}/status`, { status })
    return data
  },

  deleteTeacher: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/teachers/${id}`)
    return data
  },

  getEnrollments: async (params?: {
    page?: number
    limit?: number
    search?: string
    courseId?: string
    classId?: string
    paymentStatus?: string
    status?: string
    batchStatus?: string
  }): Promise<AdminListResponse<AdminEnrollment>> => {
    const { data } = await apiClient.get('/enrollments', { params })
    return data
  },

  getEnrollmentById: async (id: string): Promise<AdminDetailResponse<AdminEnrollment>> => {
    const { data } = await apiClient.get(`/enrollments/${id}`)
    return data
  },

  assignClassToEnrollment: async (id: string, classId: string): Promise<AdminDetailResponse<AdminEnrollment>> => {
    const { data } = await apiClient.patch(`/enrollments/${id}/assign-class`, { classId })
    return data
  },

  createEnrollment: async (payload: { studentId: string; courseId: string; paymentStatus?: string }): Promise<AdminDetailResponse<AdminEnrollment>> => {
    const { data } = await apiClient.post('/enrollments', payload)
    return data
  },

  deleteEnrollment: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/enrollments/${id}`)
    return data
  },


  getPayments: async (params?: { page?: number; limit?: number; courseId?: string; studentId?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<AdminListResponse<AdminPayment>> => {
    const { data } = await apiClient.get('/payments', { params })
    return data
  },

  getPaymentById: async (id: string): Promise<AdminDetailResponse<AdminPayment>> => {
    const { data } = await apiClient.get(`/payments/${id}`)
    return data
  },

  createAdmin: async (payload: AdminCreateAdminPayload): Promise<AdminDetailResponse<{
    id: string
    fullName: string
    email: string
    phone: string
    role: string
    status: string
  }>> => {
    const { data } = await apiClient.post('/admins', payload)
    return data
  },

  getAdmins: async (params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<AdminListResponse<{
    id: string
    fullName: string
    email: string
    phone?: string
    role: string
    status: string
  }>> => {
    const { data } = await apiClient.get('/admins', { params })
    return data
  },

  getLiveSessions: async (params?: { page?: number; limit?: number; status?: string }): Promise<AdminListResponse<any>> => {
    const { data } = await apiClient.get('/live-sessions', { params })
    return data
  },

  startLiveSession: async (id: string): Promise<AdminDetailResponse<any>> => {
    const { data } = await apiClient.post(`/live-sessions/${id}/start`)
    return data
  },

  endLiveSession: async (id: string): Promise<AdminDetailResponse<any>> => {
    const { data } = await apiClient.post(`/live-sessions/${id}/end`)
    return data
  },

  getAttendances: async (params?: { page?: number; limit?: number; courseId?: string; teacherId?: string; studentId?: string; date?: string; sortBy?: string; sortOrder?: string }): Promise<{
    success: boolean
    message: string
    meta?: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
    data: any[]
  }> => {
    const { data } = await apiClient.get('/attendances', { params })
    return data
  },

  getAttendanceReport: async (params?: { courseId?: string; teacherId?: string; studentId?: string; date?: string }): Promise<{
    success: boolean
    message: string
    data: {
      totalClasses: number
      present: number
      absent: number
      late: number
      excused: number
      attendancePercentage: number
    }
  }> => {
    const { data } = await apiClient.get('/attendances/report', { params })
    return data
  },

  createLiveSession: async (payload: any): Promise<AdminDetailResponse<any>> => {
    const { data } = await apiClient.post('/live-sessions', payload)
    return data
  },

  updateLiveSession: async (id: string, payload: any): Promise<AdminDetailResponse<any>> => {
    const { data } = await apiClient.patch(`/live-sessions/${id}`, payload)
    return data
  },

  deleteLiveSession: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/live-sessions/${id}`)
    return data
  },

  getMaterials: async (params?: { courseId?: string; classId?: string }): Promise<{ success: boolean; data: any[] }> => {
    const { data } = await apiClient.get('/materials', { params })
    return data
  },

  createMaterial: async (payload: any): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.post('/materials', payload)
    return data
  },

  updateMaterial: async (id: string, payload: any): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.patch(`/materials/${id}`, payload)
    return data
  },

  deleteMaterial: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/materials/${id}`)
    return data
  },

  getNotices: async (params?: { courseId?: string; classId?: string }): Promise<{ success: boolean; data: any[] }> => {
    const { data } = await apiClient.get('/notices', { params })
    return data
  },

  createNotice: async (payload: any): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.post('/notices', payload)
    return data
  },

  updateNotice: async (id: string, payload: any): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.patch(`/notices/${id}`, payload)
    return data
  },

  deleteNotice: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/notices/${id}`)
    return data
  },

  updateAdminStatus: async (id: string, status: 'active' | 'blocked'): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.patch(`/admins/${id}/status`, { status })
    return data
  },

  deleteAdmin: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/admins/${id}`)
    return data
  },

  getStudents: async (params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<AdminListResponse<AdminStudent>> => {
    const { data } = await apiClient.get('/students', { params })
    return data
  },

  getStudentById: async (id: string): Promise<AdminDetailResponse<AdminStudent & { enrollments: any[]; totalEnrollments: number }>> => {
    const { data } = await apiClient.get(`/students/${id}`)
    return data
  },

  updateStudentStatus: async (id: string, status: 'active' | 'blocked' | 'pending'): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.patch(`/students/${id}/status`, { status })
    return data
  },

  deleteStudent: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/students/${id}`)
    return data
  },

  warnStudent: async (id: string, payload: { title?: string; message: string }): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(`/students/${id}/warn`, payload)
    return data
  },
}



