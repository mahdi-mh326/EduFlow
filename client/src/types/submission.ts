export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded'

export interface SubmissionAssignment {
  _id: string
  title: string
  dueDate: string
  totalMarks: number
  status: string
}

export interface SubmissionStudent {
  _id: string
  fullName: string
  email: string
}

export interface Submission {
  _id: string
  assignmentId: SubmissionAssignment
  studentId: SubmissionStudent
  enrollmentId: string | null
  content: string
  attachmentUrl: string
  submittedAt: string
  status: SubmissionStatus
  marks: number | null
  feedback: string
  gradedAt: string | null
  gradedBy: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateSubmissionPayload {
  content?: string
  attachmentUrl?: string
}

export interface UpdateSubmissionPayload {
  content?: string
  attachmentUrl?: string
}

export interface SubmissionResponse {
  success: boolean
  message: string
  data: Submission
}
