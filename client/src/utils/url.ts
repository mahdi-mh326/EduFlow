import { env } from '@/config/env'

/** Returns a safe external URL, or null for untrusted/non-web schemes. */
export function getSafeExternalUrl(value: string | undefined | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

/**
 * Returns a proxy URL routed through the EduFlow backend.
 * This guarantees proper Content-Type (e.g. application/pdf) and Content-Disposition (inline preview or attachment download),
 * while completely bypassing third-party CDN restrictions (such as Cloudinary 401 on PDFs).
 */
export function getFileProxyUrl(
  rawUrl: string,
  filename?: string,
  download?: boolean,
  fileType?: string
): string {
  if (!rawUrl) return ''
  const baseUrl = env.VITE_API_BASE_URL.replace(/\/+$/, '')
  const params = new URLSearchParams()
  params.set('url', rawUrl)
  if (filename) params.set('name', filename)
  if (download) params.set('download', '1')
  if (fileType) params.set('fileType', fileType)
  return `${baseUrl}/upload/file-proxy?${params.toString()}`
}

