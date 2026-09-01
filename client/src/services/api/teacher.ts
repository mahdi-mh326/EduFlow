import { apiClient } from './client'
import type {
  TeacherDashboardClassesResponse,
  TeacherDashboardEnrollmentsResponse,
  TeacherDashboardAssignmentsResponse,
  TeacherDashboardLiveSessionsResponse,
  TeacherDashboardNoticesResponse,
  TeacherDashboardQuizzesResponse,
  TeacherClassDetailResponse,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  CreateQuizPayload,
  UpdateQuizPayload,
  TeacherSubmissionsResponse,
  TeacherQuizAttemptsResponse,
  TeacherLiveSession,
  TeacherStartAttendanceResponse,
  TeacherSubmitAttendancePayload,
  TeacherUpdateAttendancePayload,
  TeacherAttendanceRecord,
} from '@/types/teacher'

export const teacherApi = {
  getClasses: async (params?: { page?: number; limit?: number; status?: string; teacherId?: string }): Promise<TeacherDashboardClassesResponse> => {
    const { data } = await apiClient.get('/classes', { params })
    return data
  },

  getClassById: async (id: string): Promise<TeacherClassDetailResponse> => {
    const { data } = await apiClient.get(`/classes/${id}`)
    return data
  },

  getEnrollments: async (): Promise<TeacherDashboardEnrollmentsResponse> => {
    const { data } = await apiClient.get('/enrollments')
    return data
  },

  getAssignments: async (params?: { page?: number; limit?: number; status?: string; classId?: string; search?: string }): Promise<TeacherDashboardAssignmentsResponse> => {
    const { data } = await apiClient.get('/assignments', { params })
    return data
  },

  getAssignmentById: async (id: string) => {
    const { data } = await apiClient.get(`/assignments/${id}`)
    return data.data
  },

  createAssignment: async (payload: CreateAssignmentPayload) => {
    const { data } = await apiClient.post('/assignments', payload)
    return data.data
  },

  updateAssignment: async (id: string, payload: UpdateAssignmentPayload) => {
    const { data } = await apiClient.patch(`/assignments/${id}`, payload)
    return data.data
  },

  deleteAssignment: async (id: string) => {
    const { data } = await apiClient.delete(`/assignments/${id}`)
    return data
  },

  getSubmissions: async (assignmentId: string): Promise<TeacherSubmissionsResponse> => {
    const { data } = await apiClient.get(`/assignments/${assignmentId}/submissions`)
    return data
  },

  getLiveSessions: async (params?: { page?: number; limit?: number; status?: string }): Promise<TeacherDashboardLiveSessionsResponse> => {
    const { data } = await apiClient.get('/live-sessions', { params })
    return data
  },

  getNotices: async (params?: { page?: number; limit?: number }): Promise<TeacherDashboardNoticesResponse> => {
    const { data } = await apiClient.get('/notices', { params })
    return data
  },

  getQuizzes: async (params?: { page?: number; limit?: number; status?: string; classId?: string; search?: string }): Promise<TeacherDashboardQuizzesResponse> => {
    const { data } = await apiClient.get('/quizzes', { params })
    return data
  },

  getQuizById: async (id: string) => {
    const { data } = await apiClient.get(`/quizzes/${id}`)
    return data.data
  },

  createQuiz: async (payload: CreateQuizPayload) => {
    const { data } = await apiClient.post('/quizzes', payload)
    return data.data
  },

  updateQuiz: async (id: string, payload: UpdateQuizPayload) => {
    const { data } = await apiClient.patch(`/quizzes/${id}`, payload)
    return data.data
  },

  deleteQuiz: async (id: string) => {
    const { data } = await apiClient.delete(`/quizzes/${id}`)
    return data
  },

  getQuizAttempts: async (quizId: string): Promise<TeacherQuizAttemptsResponse> => {
    const { data } = await apiClient.get(`/quizzes/${quizId}/attempts`)
    return data
  },

  fetchLiveSessions: async (): Promise<TeacherLiveSession[]> => {
    const { data } = await apiClient.get('/live-sessions')
    return data.data
  },

  getLiveSessionById: async (id: string): Promise<TeacherLiveSession> => {
    const { data } = await apiClient.get(`/live-sessions/${id}`)
    return data.data
  },

  startLiveSession: async (id: string) => {
    const { data } = await apiClient.post(`/live-sessions/${id}/start`)
    return data.data
  },

  endLiveSession: async (id: string) => {
    const { data } = await apiClient.post(`/live-sessions/${id}/end`)
    return data.data
  },

  startAttendance: async (liveSessionId: string): Promise<TeacherStartAttendanceResponse> => {
    const { data } = await apiClient.post('/attendances/start', { liveSessionId })
    return data.data
  },

  submitAttendance: async (payload: TeacherSubmitAttendancePayload) => {
    const { data } = await apiClient.post('/attendances/submit', payload)
    return data.data
  },

  gradeSubmission: async (assignmentId: string, submissionId: string, payload: { marks: number; feedback?: string }) => {
    const { data } = await apiClient.patch(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload)
    return data.data
  },

  getQuestions: async (quizId: string) => {
    const { data } = await apiClient.get(`/quizzes/${quizId}/questions`)
    return data.data
  },

  createQuestion: async (quizId: string, payload: {
    questionText: string
    options: { key: string; text: string }[]
    correctAnswer: string
    marks: number
    order: number
  }) => {
    const { data } = await apiClient.post(`/quizzes/${quizId}/questions`, payload)
    return data.data
  },

  updateQuestion: async (quizId: string, questionId: string, payload: Partial<{
    questionText: string
    options: { key: string; text: string }[]
    correctAnswer: string
    marks: number
    order: number
  }>) => {
    const { data } = await apiClient.patch(`/quizzes/${quizId}/questions/${questionId}`, payload)
    return data.data
  },

  deleteQuestion: async (quizId: string, questionId: string) => {
    const { data } = await apiClient.delete(`/quizzes/${quizId}/questions/${questionId}`)
    return data
  },

  createLiveSession: async (payload: {
    courseId: string
    classId: string
    teacherId: string
    title: string
    description?: string
    scheduledDate: string
    startTime: string
    endTime: string
  }) => {
    const { data } = await apiClient.post('/live-sessions', payload)
    return data.data
  },

  updateLiveSession: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/live-sessions/${id}`, payload)
    return data.data
  },

  deleteLiveSession: async (id: string) => {
    const { data } = await apiClient.delete(`/live-sessions/${id}`)
    return data
  },

  startClassLive: async (classId: string) => {
    const { data } = await apiClient.post(`/live-sessions/class/${classId}/start`)
    return data.data
  },

  endClassLive: async (classId: string) => {
    const { data } = await apiClient.post(`/live-sessions/class/${classId}/end`)
    return data
  },

  getActiveClassLive: async (classId: string) => {
    const { data } = await apiClient.get(`/live-sessions/class/${classId}/active`)
    return data.data
  },

  submitClassAttendance: async (classId: string, payload: {
    attendanceDate?: string
    liveSessionId?: string
    students: { studentId: string; status: string; remarks?: string }[]
  }) => {
    const { data } = await apiClient.post(`/attendances/class/${classId}/submit`, payload)
    return data.data
  },

  getClassAttendanceHistory: async (classId: string) => {
    const { data } = await apiClient.get(`/attendances/class/${classId}/records`)
    return data.data
  },

  getMaterials: async (): Promise<{ data: any[] }> => {
    const { data } = await apiClient.get('/materials')
    return data
  },

  createMaterial: async (payload: {
    courseId: string
    classId: string
    title: string
    description?: string
    fileUrl?: string
    fileType?: string
  }) => {
    const { data } = await apiClient.post('/materials', payload)
    return data.data
  },

  deleteMaterial: async (id: string) => {
    const { data } = await apiClient.delete(`/materials/${id}`)
    return data
  },

  createNotice: async (payload: {

    courseId: string
    classId: string
    title: string
    description?: string
    priority?: string
  }) => {
    const { data } = await apiClient.post('/notices', payload)
    return data.data
  },

  deleteNotice: async (id: string) => {
    const { data } = await apiClient.delete(`/notices/${id}`)
    return data
  },

  updateAttendance: async (id: string, payload: TeacherUpdateAttendancePayload): Promise<TeacherAttendanceRecord> => {
    const { data } = await apiClient.patch(`/attendances/${id}`, payload)
    return data.data
  },
}


