export type TeacherClassStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export interface TeacherClassCourse {
  _id: string
  title: string
  slug: string
}

export interface TeacherClass {
  _id: string
  courseId: TeacherClassCourse
  teacherId: {
    _id: string
    fullName: string
    email: string
  }
  batchName: string
  startDate: string
  endDate: string
  classDays: string[]
  startTime: string
  endTime: string
  status: TeacherClassStatus
  sections: Array<{
    name: string
    capacity: number
    currentStudents: number
    status: string
  }>
  createdAt: string
  updatedAt: string
}

export interface TeacherEnrollmentStudent {
  _id: string
  fullName: string
  email: string
  phone?: string
  avatar?: string
}


export interface TeacherEnrollmentCourse {
  _id: string
  title: string
  slug: string
  thumbnail?: string
  shortDescription: string
  price: number
}

export interface TeacherEnrollmentClass {
  _id: string
  batchName: string
  startDate: string
  endDate: string
  teacherId: {
    _id: string
    fullName: string
    email: string
  }
  sections: Array<{
    name: string
    capacity: number
    currentStudents: number
    status: string
  }>
}

export interface TeacherEnrollment {
  _id: string
  studentId: TeacherEnrollmentStudent
  courseId: TeacherEnrollmentCourse
  classId: TeacherEnrollmentClass
  sectionId: string
  paymentStatus: string
  transactionId?: string
  enrolledAt: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface TeacherAssignmentCourse {
  _id: string
  title: string
  slug: string
}

export interface TeacherAssignmentClass {
  _id: string
  batchName: string
  startDate: string
  endDate: string
}

export interface TeacherAssignmentTeacher {
  _id: string
  fullName: string
  email: string
}

export type AssignmentStatus = 'draft' | 'published' | 'closed'

export interface TeacherAssignment {
  _id: string
  courseId: TeacherAssignmentCourse
  classId: TeacherAssignmentClass
  teacherId: TeacherAssignmentTeacher
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

export interface TeacherLiveSessionCourse {
  _id: string
  title: string
  slug: string
}

export interface TeacherLiveSessionClass {
  _id: string
  batchName: string
  startDate: string
  endDate: string
}

export interface TeacherLiveSessionTeacher {
  _id: string
  fullName: string
  email: string
}

export type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

export interface TeacherLiveSession {
  _id: string
  courseId: TeacherLiveSessionCourse
  classId: TeacherLiveSessionClass
  teacherId: TeacherLiveSessionTeacher
  title: string
  description: string
  meetingRoom: string
  meetingUrl: string
  scheduledDate: string
  startTime: string
  endTime: string
  status: LiveSessionStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface TeacherAttendanceStudent {
  _id: string
  fullName: string
  email: string
  phone?: string
}

export interface TeacherStartAttendanceResponse {
  liveSession: {
    _id: string
    title: string
    scheduledDate: string
    startTime: string
    endTime: string
  }
  classId: string
  courseId: string
  teacherId: string
  students: TeacherAttendanceStudent[]
  totalStudents: number
}

export interface TeacherAttendanceRecord {
  _id: string
  liveSessionId: string
  courseId: string
  classId: string
  teacherId: string
  studentId: string
  attendanceDate: string
  status: AttendanceStatus
  checkInTime?: string
  remarks?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TeacherSubmitAttendancePayload {
  liveSessionId: string
  students: Array<{
    studentId: string
    status: AttendanceStatus
    checkInTime?: string
    remarks?: string
  }>
}

export interface TeacherUpdateAttendancePayload {
  status?: AttendanceStatus
  checkInTime?: string
  remarks?: string
}

export interface TeacherAttendanceReport {
  totalClasses: number
  present: number
  absent: number
  late: number
  excused: number
  attendancePercentage: number
}

export interface TeacherNoticeCourse {
  _id: string
  title: string
  slug: string
}

export interface TeacherNoticeClass {
  _id: string
  batchName: string
}

export interface TeacherNotice {
  _id: string
  courseId?: TeacherNoticeCourse
  classId?: TeacherNoticeClass
  teacherId: {
    _id: string
    fullName: string
    email: string
  }
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  publishDate: string
  expiryDate?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TeacherQuizCourse {
  _id: string
  title: string
  slug: string
}

export interface TeacherQuizClass {
  _id: string
  batchName: string
  startDate: string
  endDate: string
}

export interface TeacherQuizTeacher {
  _id: string
  fullName: string
  email: string
}

export type QuizStatus = 'draft' | 'published' | 'closed'

export interface TeacherQuiz {
  _id: string
  courseId: TeacherQuizCourse
  classId: TeacherQuizClass
  teacherId: TeacherQuizTeacher
  title: string
  description: string
  instructions: string
  durationMinutes: number
  totalMarks: number
  passingMarks: number
  startDate: string
  endDate: string
  attemptLimit: number
  status: QuizStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TeacherDashboardClassesResponse {
  success: boolean
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: TeacherClass[]
}

export interface TeacherDashboardEnrollmentsResponse {
  success: boolean
  message: string
  data: TeacherEnrollment[]
}

export interface TeacherDashboardAssignmentsResponse {
  success: boolean
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: TeacherAssignment[]
}

export interface TeacherDashboardLiveSessionsResponse {
  success: boolean
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: TeacherLiveSession[]
}

export interface TeacherDashboardNoticesResponse {
  success: boolean
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: TeacherNotice[]
}

export interface TeacherDashboardQuizzesResponse {
  success: boolean
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: TeacherQuiz[]
}

export interface TeacherClassDetailResponse {
  success: boolean
  message: string
  data: TeacherClass
}

export interface TeacherSubmissionStudent {
  _id: string
  fullName: string
  email: string
}

export interface TeacherSubmissionAssignment {
  _id: string
  title: string
  dueDate: string
  totalMarks: number
  status: string
}

export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded'

export interface TeacherSubmission {
  _id: string
  assignmentId: TeacherSubmissionAssignment
  studentId: TeacherSubmissionStudent
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

export interface TeacherSubmissionsResponse {
  success: boolean
  message: string
  data: TeacherSubmission[]
}

export interface TeacherQuizAttemptStudent {
  _id: string
  fullName: string
  email: string
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired'

export interface TeacherQuizAttempt {
  _id: string
  quizId: string
  studentId: TeacherQuizAttemptStudent
  attemptNumber: number
  startedAt: string
  expiresAt: string
  submittedAt: string | null
  status: AttemptStatus
  score: number
  totalMarks: number
  percentage: number
  passed: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TeacherQuizAttemptsResponse {
  success: boolean
  message: string
  data: TeacherQuizAttempt[]
}

export interface CreateAssignmentPayload {
  courseId: string
  classId: string
  title: string
  description?: string
  instructions?: string
  attachmentUrl?: string
  dueDate: string
  totalMarks: number
  status?: 'draft' | 'published' | 'closed'
}

export interface UpdateAssignmentPayload {
  courseId?: string
  classId?: string
  title?: string
  description?: string
  instructions?: string
  attachmentUrl?: string
  dueDate?: string
  totalMarks?: number
  status?: 'draft' | 'published' | 'closed'
}

export interface CreateQuizPayload {
  courseId: string
  classId: string
  title: string
  description?: string
  instructions?: string
  durationMinutes: number
  totalMarks: number
  passingMarks: number
  startDate: string
  endDate: string
  attemptLimit: number
  status?: 'draft' | 'published' | 'closed'
}

export interface UpdateQuizPayload {
  courseId?: string
  classId?: string
  title?: string
  description?: string
  instructions?: string
  durationMinutes?: number
  totalMarks?: number
  passingMarks?: number
  startDate?: string
  endDate?: string
  attemptLimit?: number
  status?: 'draft' | 'published' | 'closed'
}
