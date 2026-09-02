import { apiClient } from './client'

export interface UploadFileResponse {
  url: string
  publicId: string
  originalName: string
  fileType: string
  format: string
  bytes: number
}

export const uploadApi = {
  uploadFile: async (file: File, folder?: string): Promise<UploadFileResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    if (folder) {
      formData.append('folder', folder)
    }

    const { data } = await apiClient.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },
}
