import { apiClient } from './client'
import type {
  RegisterPayload,
  RegisterResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
  ResendOTPPayload,
  ResendOTPResponse,
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  CurrentUserResponse,
} from '@/types/auth'

export const authApi = {
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const { data } = await apiClient.post('/auth/register', payload)
    return data.data
  },

  verifyEmail: async (payload: VerifyEmailPayload): Promise<VerifyEmailResponse> => {
    const { data } = await apiClient.post('/auth/verify-email', payload)
    return data.data
  },

  resendOTP: async (payload: ResendOTPPayload): Promise<ResendOTPResponse> => {
    const { data } = await apiClient.post('/auth/resend-otp', payload)
    return data.data
  },

  sendVerificationOTP: async (payload: ResendOTPPayload): Promise<ResendOTPResponse> => {
    const { data } = await apiClient.post('/auth/send-verification-otp', payload)
    return data.data
  },

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', payload)
    return data.data
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const { data } = await apiClient.post('/auth/refresh-token')
    return data.data
  },

  logout: async (): Promise<LogoutResponse> => {
    const { data } = await apiClient.post('/auth/logout')
    return data.data
  },

  setPassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/set-password', payload)
    return data.data
  },

  getCurrentUser: async (): Promise<CurrentUserResponse['data']> => {
    const { data } = await apiClient.get('/users/me')
    return data.data
  },

  updateProfile: async (payload: {
    fullName?: string
    phone?: string
    gender?: 'male' | 'female' | 'other'
    avatar?: string
    dateOfBirth?: string
  }): Promise<CurrentUserResponse['data']> => {
    const { data } = await apiClient.patch('/users/me', payload)
    return data.data
  },

  uploadAvatar: async (file: File): Promise<{ avatar: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const { data } = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> => {
    const { data } = await apiClient.patch('/users/change-password', payload)
    return { message: data.message }
  },

  forgotPassword: async (email: string): Promise<{ email: string; message: string }> => {
    const { data } = await apiClient.post('/auth/forgot-password', { email })
    return data.data
  },

  resetPassword: async (payload: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/reset-password', payload)
    return data.data
  },
}


