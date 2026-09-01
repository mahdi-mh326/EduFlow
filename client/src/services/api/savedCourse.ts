import { apiClient } from './client'
import type { CourseResponse } from './course'

export interface SavedCourseItem {
  _id: string
  course: CourseResponse
  activeClassCount: number
  hasAvailableBatch: boolean
  savedAt: string
}

export const savedCourseApi = {
  toggleSaveCourse: async (courseId: string): Promise<{ isSaved: boolean; courseId: string }> => {
    const { data } = await apiClient.post('/saved-courses/toggle', { courseId })
    return data.data
  },

  getSavedCourses: async (): Promise<SavedCourseItem[]> => {
    const { data } = await apiClient.get('/saved-courses')
    return data.data
  },

  checkCourseSaved: async (courseId: string): Promise<{ isSaved: boolean }> => {
    const { data } = await apiClient.get(`/saved-courses/${courseId}/check`)
    return data.data
  },
}
