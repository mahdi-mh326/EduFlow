import { apiClient } from './client'
import type {
  Submission,
  CreateSubmissionPayload,
  UpdateSubmissionPayload,
  SubmissionResponse,
} from '@/types/submission'

export const submissionApi = {
  createSubmission: async (assignmentId: string, payload: CreateSubmissionPayload): Promise<Submission> => {
    const { data } = await apiClient.post<SubmissionResponse>(`/assignments/${assignmentId}/submissions`, payload)
    return data.data
  },

  getMySubmission: async (assignmentId: string): Promise<Submission> => {
    const { data } = await apiClient.get<SubmissionResponse>(`/assignments/${assignmentId}/submissions/me`)
    return data.data
  },

  updateMySubmission: async (assignmentId: string, payload: UpdateSubmissionPayload): Promise<Submission> => {
    const { data } = await apiClient.patch<SubmissionResponse>(`/assignments/${assignmentId}/submissions/me`, payload)
    return data.data
  },
}
