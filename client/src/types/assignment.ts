export type AssignmentStatus = 'draft' | 'published' | 'closed'

export interface AssignmentCourse {
  _id: string
  title: string
  slug: string
}

export interface AssignmentClass {
  _id: string
  batchName: string
  startDate: string
  endDate: string
}

export interface AssignmentTeacher {
  _id: string
  fullName: string
  email: string
}

export interface Assignment {
  _id: string
  courseId: AssignmentCourse
  classId: AssignmentClass
  teacherId: AssignmentTeacher
  title: string
  description: string
  instructions: string
  attachmentUrl: string
  dueDate: string
  totalMarks: number
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
}

export interface AssignmentListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AssignmentListResponse {
  success: boolean
  message: string
  meta: AssignmentListMeta
  data: Assignment[]
}

export interface AssignmentDetailsResponse {
  success: boolean
  message: string
  data: Assignment
}

export interface GetAssignmentsParams {
  page?: number
  limit?: number
  search?: string
  classId?: string
  status?: string
  sortBy?: 'newest' | 'dueDate'
  sortOrder?: 'asc' | 'desc'
}

export interface GetAssignmentsResult {
  meta: AssignmentListMeta
  data: Assignment[]
}
