import { apiClient } from './client'
import type {
  Assignment,
  AssignmentListResponse,
  AssignmentDetailsResponse,
  GetAssignmentsParams,
  GetAssignmentsResult,
} from '@/types/assignment'

export const assignmentApi = {
  getAssignments: async (params?: GetAssignmentsParams): Promise<GetAssignmentsResult> => {
    const { data } = await apiClient.get<AssignmentListResponse>('/assignments', { params })
    return {
      meta: data.meta,
      data: data.data,
    }
  },

  getAssignmentById: async (id: string): Promise<Assignment> => {
    const { data } = await apiClient.get<AssignmentDetailsResponse>(`/assignments/${id}`)
    return data.data
  },
}
