export interface Certificate {
  _id: string
  certificateNumber: string
  studentId: {
    _id: string
    fullName: string
    email: string
    avatar?: string
  }
  courseId: {
    _id: string
    title: string
    slug: string
    category: string
    thumbnail?: string
    duration?: number
    durationUnit?: string
  }
  classId: {
    _id: string
    batchName: string
    startDate?: string
    endDate?: string
  }
  issueDate: string
  completionPercentage: number
  grade: string
  isRevoked: boolean
  revokedReason?: string
  createdAt: string
  updatedAt: string
}

export interface ClassProgress {
  classId: string
  courseId: string
  totalItems: number
  completedItems: number
  percentage: number
  breakdown: {
    live: { attended: number; total: number }
    assignments: { submitted: number; total: number }
    quizzes: { attempted: number; total: number }
  }
  isEligibleForCertificate: boolean
}

export interface CertificateVerificationResult {
  valid: boolean
  certificateNumber: string
  issueDate: string
  grade: string
  completionPercentage: number
  recipient: {
    fullName: string
    avatar?: string
  }
  course: {
    title: string
    category: string
    duration: string
  }
  class: {
    batchName: string
  }
  isRevoked: boolean
  revokedReason?: string
}
