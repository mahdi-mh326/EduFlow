import axios, { type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from './auth'

let isRefreshing = false
type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

let pendingRequests: Array<{
  resolve: (token: string) => void
  reject: (reason?: unknown) => void
}> = []

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest | undefined
    const requestUrl = originalRequest?.url ?? ''
    // Authentication endpoints must never be retried through refresh. Retrying a
    // failed login/logout is surprising, and a failed refresh must not recurse.
    const isAuthRequest = requestUrl.includes('/auth/')

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const result = await authApi.refreshToken()
      const newToken = result.accessToken
      useAuthStore.getState().setAccessToken(newToken)

      pendingRequests.forEach(({ resolve }) => resolve(newToken))
      pendingRequests = []

      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      useAuthStore.getState().logout()
      pendingRequests.forEach(({ reject }) => reject(refreshError))
      pendingRequests = []
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
