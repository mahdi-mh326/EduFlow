import { apiClient } from './client'
import type { StudentQuiz, StudentQuizAttempt, StudentQuizQuestion } from '@/types/quiz'

export const quizApi = {
  getQuizzes: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ meta: { total: number; page: number; limit: number; totalPages: number }; data: StudentQuiz[] }> => {
    const { data } = await apiClient.get('/quizzes', { params })
    return { meta: data.meta, data: data.data }
  },

  getQuizById: async (id: string): Promise<StudentQuiz> => {
    const { data } = await apiClient.get(`/quizzes/${id}`)
    return data.data
  },

  getQuestions: async (quizId: string): Promise<StudentQuizQuestion[]> => {
    const { data } = await apiClient.get(`/quizzes/${quizId}/questions`)
    return data.data
  },

  startAttempt: async (quizId: string): Promise<StudentQuizAttempt> => {
    const { data } = await apiClient.post(`/quizzes/${quizId}/attempts`, {})
    return data.data
  },

  getCurrentAttempt: async (quizId: string): Promise<StudentQuizAttempt> => {
    const { data } = await apiClient.get(`/quizzes/${quizId}/attempts/current`)
    return data.data
  },

  getMyAttempts: async (quizId: string): Promise<StudentQuizAttempt[]> => {
    const { data } = await apiClient.get(`/quizzes/${quizId}/attempts/me`)
    return data.data
  },

  submitAttempt: async (quizId: string, attemptId: string, answers: Array<{ questionId: string; selectedOption: string }>): Promise<StudentQuizAttempt> => {
    const { data } = await apiClient.post(`/quizzes/${quizId}/attempts/${attemptId}/submit`, { answers })
    return data.data
  },
}
