export { getSafeExternalUrl } from './url'
export function formatCurrency(amount: number | null | undefined, currency = 'BDT'): string {
  if (amount == null || !Number.isFinite(amount)) return 'N/A'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getAvatarUrl(avatar?: string | null): string {
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'
  const backendHost = baseUrl.replace(/\/api\/v1\/?$/, '')
  return `${backendHost}${avatar.startsWith('/') ? '' : '/'}${avatar}`
}

export const getImageUrl = getAvatarUrl



