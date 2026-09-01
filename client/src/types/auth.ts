export type UserRole = 'admin' | 'teacher' | 'student'


export type UserStatus = 'pending' | 'active' | 'blocked'

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  avatar?: string
  gender?: 'male' | 'female' | 'other'
  dateOfBirth?: string
  isVerified: boolean
  isMasterAdmin?: boolean
  mustChangePassword?: boolean
  lastLogin?: string
}


export interface RegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
  gender?: 'male' | 'female' | 'other'
  dateOfBirth?: string
}

export interface RegisterResponse {
  id: string
  email: string
  fullName: string
  message: string
}

export interface VerifyEmailPayload {
  email: string
  otp: string
}

export interface VerifyEmailResponse {
  id: string
  email: string
  fullName: string
  role?: string
  isVerified?: boolean
  mustChangePassword?: boolean
  accessToken?: string
  refreshToken?: string
  user?: User
  message: string
}


export interface ResendOTPPayload {
  email: string
}

export interface ResendOTPResponse {
  email: string
  message: string
}

export interface LoginPayload {
  email: string
  password: string
  role?: UserRole
}


export interface LoginResponse {
  user: User
  accessToken: string
  forcePasswordChange?: boolean
  requireEmailVerification?: boolean
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface LogoutResponse {
  message: string
}

export interface AuthErrorPayload {
  message: string
  statusCode?: number
  success?: boolean
  data?: null
}

export interface CurrentUserResponse {
  success: boolean
  message: string
  data: User
}
