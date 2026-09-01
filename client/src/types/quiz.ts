export interface StudentQuizCourse {
  _id: string
  title: string
  slug: string
}

export interface StudentQuizClass {
  _id: string
  batchName: string
  startDate: string
  endDate: string
}

export interface StudentQuizTeacher {
  _id: string
  fullName: string
  email: string
}

export interface StudentQuiz {
  _id: string
  courseId: StudentQuizCourse
  classId: StudentQuizClass
  teacherId: StudentQuizTeacher
  title: string
  description: string
  instructions: string
  durationMinutes: number
  totalMarks: number
  passingMarks: number
  startDate: string
  endDate: string
  attemptLimit: number
  status: 'draft' | 'published' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface QuizQuestionOption {
  key: string
  text: string
}

export interface StudentQuizQuestion {
  _id: string
  quizId: string
  questionText: string
  type: 'mcq'
  options: QuizQuestionOption[]
  marks: number
  order: number
}

export type QuizAttemptStatus = 'in_progress' | 'submitted' | 'expired'

export interface StudentQuizAttempt {
  _id: string
  quizId: string
  attemptNumber: number
  startedAt: string
  expiresAt: string
  submittedAt: string | null
  status: QuizAttemptStatus
  score: number
  totalMarks: number
  percentage: number
  passed: boolean
}
