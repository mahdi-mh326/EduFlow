import { apiClient } from './client'

export interface CourseResponse {
  _id: string
  title: string
  slug: string
  thumbnail?: string
  banner?: string
  shortDescription: string
  description?: string
  price: number
  offerPrice?: number
  offerPercentage?: number
  category: string
  difficulty: string
  durationValue: number
  durationUnit: string
  status: string
  featured: boolean
  createdBy: string
  createdAt?: string
  updatedAt?: string
}

export interface ClassResponse {
  _id: string
  courseId: string
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
  status: string
  sections: Array<{
    _id: string
    name: string
    capacity: number
    currentStudents: number
    status: string
  }>
}

export interface ClassesQueryResult {
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: ClassResponse[]
}

export interface CoursesQueryResult {
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: CourseResponse[]
}

export const courseApi = {
  getCourses: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    difficulty?: string
    featured?: boolean
    sortBy?: 'newest' | 'price' | 'title'
    sortOrder?: 'asc' | 'desc'
  }): Promise<CoursesQueryResult> => {
    const { data } = await apiClient.get('/courses', { params })
    return {
      meta: data.meta,
      data: data.data,
    }
  },

  getCourseBySlug: async (slug: string): Promise<CourseResponse> => {
    const { data } = await apiClient.get(`/courses/${slug}`)
    return data.data
  },

  getClasses: async (params: { courseId?: string; page?: number; limit?: number }): Promise<ClassesQueryResult> => {
    const { data } = await apiClient.get('/classes', { params })
    return {
      meta: data.meta,
      data: data.data,
    }
  },

  getClassById: async (id: string): Promise<ClassResponse> => {
    const { data } = await apiClient.get(`/classes/${id}`)
    return data.data
  },
}

