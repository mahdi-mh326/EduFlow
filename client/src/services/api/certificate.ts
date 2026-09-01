import { apiClient } from './client'

import type { Certificate, ClassProgress, CertificateVerificationResult } from '@/types/certificate'

export const certificateApi = {
  claimCertificate: async (classId: string): Promise<Certificate> => {
    const response = await apiClient.post('/certificates/claim', { classId })
    return response.data.data
  },

  getMyCertificates: async (): Promise<Certificate[]> => {
    const response = await apiClient.get('/certificates/my-certificates')
    return response.data.data
  },

  getCertificateByClass: async (classId: string): Promise<Certificate | null> => {
    const response = await apiClient.get(`/certificates/class/${classId}`)
    return response.data.data
  },

  getProgress: async (classId: string): Promise<ClassProgress> => {
    const response = await apiClient.get(`/certificates/progress/${classId}`)
    return response.data.data
  },

  verifyCertificate: async (certificateNumber: string): Promise<CertificateVerificationResult> => {
    const response = await apiClient.get(`/certificates/verify/${certificateNumber}`)
    return response.data.data
  },

  getAllCertificates: async (): Promise<Certificate[]> => {
    const response = await apiClient.get('/certificates')
    return response.data.data
  },
}


