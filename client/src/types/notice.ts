export interface Notice {
  _id: string
  courseId?: {
    _id: string
    title: string
    slug?: string
  }
  classId?: {
    _id: string
    batchName: string
  }
  teacherId?: {
    _id: string
    fullName: string
    email?: string
  }
  targetAudience?: 'all' | 'students' | 'teachers'
  title: string
  description: string
  attachmentUrl?: string
  isPinned?: boolean
  priority: 'low' | 'medium' | 'high'
  publishDate: string
  expiryDate?: string
  createdBy?: any
  createdAt: string
  updatedAt: string
}

export interface CreateNoticePayload {
  courseId?: string
  classId?: string
  teacherId?: string
  targetAudience?: 'all' | 'students' | 'teachers'
  title: string
  description?: string
  attachmentUrl?: string
  isPinned?: boolean
  priority?: 'low' | 'medium' | 'high'
  publishDate?: string
  expiryDate?: string
}

export interface UpdateNoticePayload {
  courseId?: string
  classId?: string
  teacherId?: string
  targetAudience?: 'all' | 'students' | 'teachers'
  title?: string
  description?: string
  attachmentUrl?: string
  isPinned?: boolean
  priority?: 'low' | 'medium' | 'high'
  publishDate?: string
  expiryDate?: string
}


export interface NoticeListResponse {
  statusCode: number
  success: boolean
  message: string
  data: Notice[]
}

export interface NoticeDetailResponse {
  statusCode: number
  success: boolean
  message: string
  data: Notice
}
