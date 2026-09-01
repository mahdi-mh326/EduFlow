import { apiClient } from './client'
import type { CreateEnrollmentPayload, CreateEnrollmentResponse, EnrollmentQueryResult } from '@/types/enrollment'

export const enrollmentApi = {
  getEnrollments: async (): Promise<EnrollmentQueryResult['data']> => {
    const { data } = await apiClient.get('/enrollments')
    return data.data
  },

  getEnrollmentById: async (id: string) => {
    const { data } = await apiClient.get(`/enrollments/${id}`)
    return data.data
  },

  createEnrollment: async (payload: CreateEnrollmentPayload): Promise<CreateEnrollmentResponse> => {
    const { data } = await apiClient.post('/enrollments', payload)
    return data.data
  },

  cancelEnrollment: async (id: string) => {
    const { data } = await apiClient.delete(`/enrollments/${id}`)
    return data.data
  },
}
