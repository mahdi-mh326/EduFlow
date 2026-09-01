export interface StudentDashboardStudent {
  id: string
  fullName: string
  email: string
  phone: string
  avatar?: string
  gender?: 'male' | 'female' | 'other'
}

export interface StudentDashboardCourse {
  course: {
    _id: string
    title: string
    slug: string
    thumbnail?: string
    shortDescription: string
    price: number
  }
  batch: string | null
  section: string
  teacher: {
    _id: string
    fullName: string
    email: string
  } | null
  enrollmentDate: string
  status: string
  paymentStatus?: string
}

export interface StudentDashboardResponse {
  student: StudentDashboardStudent
  enrolledCourses: StudentDashboardCourse[]
  totalCourses: number
}

export interface StudentEnrollment {
  _id: string
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
  paymentStatus: string
  enrolledAt: string
  status: string
}

export interface StudentLiveSession {
  _id: string
  courseId: {
    _id: string
    title: string
    slug: string
  }
  classId: {
    _id: string
    batchName: string
    startDate: string
    endDate: string
  }
  teacherId: {
    _id: string
    fullName: string
    email: string
  }
  title: string
  description: string
  meetingRoom: string
  meetingUrl: string
  scheduledDate: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
}

export interface StudentAttendance {
  _id: string
  course: {
    _id: string
    title: string
    slug: string
  }
  class: {
    _id: string
    batchName: string
  }
  teacher: {
    _id: string
    fullName: string
    email: string
  }
  liveSession: {
    _id: string
    title: string
    scheduledDate: string
    startTime: string
    endTime: string
  }
  attendanceDate: string
  status: 'present' | 'absent' | 'late' | 'excused'
  checkInTime?: string
  remarks?: string
}

export interface StudentNotice {
  _id: string
  courseId?: {
    _id: string
    title: string
    slug: string
  }
  classId?: {
    _id: string
    batchName: string
  }
  teacherId?: {
    _id: string
    fullName: string
    email: string
  }
  targetAudience?: 'all' | 'students' | 'teachers'
  title: string
  description: string
  attachmentUrl?: string
  isPinned?: boolean
  priority: 'low' | 'medium' | 'high'
  publishDate: string
  expiryDate?: string
}


export interface StudentAttendanceReport {
  totalClasses: number
  present: number
  absent: number
  late: number
  excused: number
  attendancePercentage: number
}
