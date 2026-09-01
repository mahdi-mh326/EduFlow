import { apiClient } from './client'
import type {
  Material,
  CreateMaterialPayload,
  UpdateMaterialPayload,
  MaterialListResponse,
  MaterialDetailResponse,
} from '@/types/material'

export const materialApi = {
  getMaterials: async (params?: { courseId?: string; classId?: string; fileType?: string; search?: string }): Promise<Material[]> => {
    const { data } = await apiClient.get<MaterialListResponse>('/materials', { params })
    return data.data || []
  },

  getMaterialById: async (id: string): Promise<Material> => {
    const { data } = await apiClient.get<MaterialDetailResponse>(`/materials/${id}`)
    return data.data
  },

  createMaterial: async (payload: CreateMaterialPayload): Promise<Material> => {
    const { data } = await apiClient.post<MaterialDetailResponse>('/materials', payload)
    return data.data
  },

  updateMaterial: async (id: string, payload: UpdateMaterialPayload): Promise<Material> => {
    const { data } = await apiClient.patch<MaterialDetailResponse>(`/materials/${id}`, payload)
    return data.data
  },

  deleteMaterial: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/materials/${id}`)
    return data
  },
}
