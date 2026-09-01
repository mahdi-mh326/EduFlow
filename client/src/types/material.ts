export interface Material {
  _id: string
  courseId: {
    _id: string
    title: string
    slug?: string
  }
  classId: {
    _id: string
    batchName: string
  }
  teacherId?: {
    _id: string
    fullName: string
    email?: string
  }
  title: string
  description?: string
  fileUrl: string
  fileType: 'pdf' | 'video' | 'document' | 'audio' | 'image' | 'archive' | 'link' | string
  visibility: 'public' | 'private' | string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialPayload {
  courseId: string
  classId: string
  teacherId?: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  visibility?: 'public' | 'private'
}

export interface UpdateMaterialPayload {
  courseId?: string
  classId?: string
  teacherId?: string
  title?: string
  description?: string
  fileUrl?: string
  fileType?: string
  visibility?: 'public' | 'private'
}

export interface MaterialListResponse {
  statusCode: number
  success: boolean
  message: string
  data: Material[]
}

export interface MaterialDetailResponse {
  statusCode: number
  success: boolean
  message: string
  data: Material
}
