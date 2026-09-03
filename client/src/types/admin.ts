export type AdminRole = 'admin'


export type CourseStatus = 'draft' | 'published' | 'archived'
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type CourseCategory = 'Programming' | 'Web Development' | 'Mobile Development' | 'UI/UX Design' | 'Graphic Design' | 'Cyber Security' | 'Artificial Intelligence' | 'Data Science' | 'Networking' | 'Database' | 'Cloud Computing' | 'DevOps' | 'Other'
export type CourseDurationUnit = 'day' | 'week' | 'month' | 'year'

export interface AdminCourse {
  _id: string
  title: string
  slug: string
  shortDescription: string
  description: string
  price: number
  offerPrice?: number
  durationValue: number
  durationUnit: CourseDurationUnit
  category: CourseCategory
  difficulty: CourseDifficulty
  thumbnail?: string
  banner?: string
  status: CourseStatus
  featured: boolean
  timelineVisible: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AdminClass {
  _id: string
  courseId: {
    _id: string
    title: string
    slug: string
  }
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
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  capacity?: number
  currentStudents?: number
  sections?: Array<{
    name: string
    capacity: number
    currentStudents: number
    status: string
  }>

  createdBy: string
  createdAt: string
  updatedAt: string
}


export interface AdminTeacher {
  _id: string
  fullName: string
  email: string
  phone: string
  gender?: 'male' | 'female' | 'other'
  avatar?: string
  role: 'teacher'
  status: 'pending' | 'active' | 'blocked'
  isVerified: boolean
  mustChangePassword?: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  teacherProfile?: {
    _id: string
    employeeId: string
    designation: string
    qualification: string
  }
}

export interface AdminStudent {
  _id: string
  fullName: string
  email: string
  phone: string
  gender?: 'male' | 'female' | 'other'
  avatar?: string
  role: 'student'
  status: 'pending' | 'active' | 'blocked'
  isVerified: boolean
  enrollmentCount?: number
  createdAt: string
  updatedAt: string
}

export interface AdminEnrollment {

  _id: string
  studentId: {
    _id: string
    fullName: string
    email: string
    phone: string
    avatar?: string
  }

  courseId: {
    _id: string
    title: string
    slug: string
    thumbnail?: string
    shortDescription: string
    price: number
  }
  classId: {
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
  sectionId: string
  paymentStatus: 'pending' | 'success' | 'failed' | 'paid'
  transactionId?: string
  enrolledAt: string
  status: 'active' | 'cancelled'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AdminPayment {
  _id: string
  studentId: {
    _id: string
    fullName: string
    email: string
    phone: string
  }
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

export interface AdminCreateCoursePayload {
  title: string
  shortDescription: string
  description: string
  price: number
  offerPrice?: number
  durationValue: number
  durationUnit: CourseDurationUnit
  category: CourseCategory
  difficulty: CourseDifficulty
  thumbnail?: string
  banner?: string
  featured?: boolean
}

export interface AdminUpdateCoursePayload {
  title?: string
  shortDescription?: string
  description?: string
  price?: number
  offerPrice?: number
  durationValue?: number
  durationUnit?: CourseDurationUnit
  category?: CourseCategory
  difficulty?: CourseDifficulty
  thumbnail?: string
  banner?: string
  featured?: boolean
  status?: CourseStatus
  timelineVisible?: boolean
}

export interface AdminCreateClassPayload {
  courseId: string
  teacherId: string
  batchName: string
  startDate: string
  endDate: string
  classDays: string[]
  startTime: string
  endTime: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

export interface AdminUpdateClassPayload {
  courseId?: string
  teacherId?: string
  batchName?: string
  startDate?: string
  endDate?: string
  classDays?: string[]
  startTime?: string
  endTime?: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

export interface AdminCreateTeacherPayload {
  fullName: string
  email: string
  phone: string
  gender?: 'male' | 'female' | 'other'
  avatar?: string
  designation: string
  qualification: string
}

export interface AdminUpdateTeacherPayload {
  fullName?: string
  email?: string
  phone?: string
  gender?: 'male' | 'female' | 'other'
  avatar?: string
  designation?: string
  qualification?: string
}


export interface AdminCreateAdminPayload {
  fullName: string
  email: string
  phone: string
  gender?: 'male' | 'female' | 'other'
}

export interface AdminListResponse<T> {
  success: boolean
  message: string
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: T[]
}

export interface AdminDetailResponse<T> {
  success: boolean
  message: string
  data: T
}
