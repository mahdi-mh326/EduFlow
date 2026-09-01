export type EnrollmentStatus = 'active' | 'cancelled'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'paid'

export interface EnrollmentCourse {
  _id: string
  title: string
  slug: string
  thumbnail?: string
  shortDescription: string
  price: number
}

export interface EnrollmentTeacher {
  _id: string
  fullName: string
  email: string
}

export interface EnrollmentClass {
  _id: string
  batchName: string
  startDate: string
  endDate: string
  teacherId: EnrollmentTeacher
  sections: Array<{
    name: string
    capacity: number
    currentStudents: number
    status: string
  }>
}

export interface Enrollment {
  _id: string
  courseId: EnrollmentCourse
  classId: EnrollmentClass
  sectionId: string
  paymentStatus: PaymentStatus
  transactionId?: string
  enrolledAt: string
  status: EnrollmentStatus
  createdBy: string
}

export interface CreateEnrollmentPayload {
  courseId: string
  classId?: string
}


export interface CreateEnrollmentResponse {
  _id: string
  courseId: EnrollmentCourse
  classId: EnrollmentClass
  sectionId: string
  paymentStatus: PaymentStatus
  enrolledAt: string
  status: EnrollmentStatus
}

export interface EnrollmentQueryResult {
  data: Enrollment[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface Payment {
  _id: string
  studentId: string
  courseId: {
    _id: string
    title: string
    slug: string
    thumbnail?: string
    price: number
  }
  classId: {
    _id: string
    batchName: string
    startDate: string
    endDate: string
  }
  amount: number
  currency: string
  gateway: string
  transactionId: string
  bankTransactionId?: string
  valId?: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  paymentMethod?: string
  paidAt?: string
  enrolledAt?: string
  createdAt: string
  updatedAt: string
}

export interface InitiatePaymentPayload {
  courseId: string
  classId: string
}

export interface InitiatePaymentResponse {
  paymentId: string
  transactionId: string
  gatewayUrl: string
}
