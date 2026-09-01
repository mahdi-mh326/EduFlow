export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (typeof error === 'string') return error

  const axiosError = error as any
  const status = axiosError?.response?.status
  const data = axiosError?.response?.data

  if (status === 401) {
    return 'Your session has expired. Please log in again.'
  }

  if (status === 403) {
    return 'Access restricted. You do not have permission to perform this action.'
  }

  if (status === 404) {
    return 'The requested resource was not found.'
  }

  if (status === 409) {
    return data?.message || 'A conflict occurred. Please review your input and try again.'
  }

  if (status === 422) {
    const message = data?.message || data?.error
    if (message) return message
    return 'Please check your input and try again.'
  }

  if (status === 429) {
    return 'Too many requests. Please try again shortly.'
  }

  if (status >= 500) {
    return 'Something went wrong on the server. Please try again.'
  }

  if (axiosError?.code === 'ECONNABORTED' || axiosError?.message === 'Network Error' || axiosError?.code === 'ERR_NETWORK') {
    return 'Unable to connect to the server. Please check your connection and try again.'
  }

  const message = data?.message || data?.error
  if (message) return message

  if (axiosError?.message) {
    return axiosError.message
  }

  return fallback
}
