import { FileTextIcon, DownloadIcon, ExternalLinkIcon } from '@/components/ui/icons'
import { getFileProxyUrl, getSafeExternalUrl } from '@/utils'

interface AttachmentCardProps {
  url: string
  label?: string
  filename?: string
  className?: string
}

function extractFilename(url: string, fallback?: string): string {
  if (fallback && fallback.includes('.')) return fallback
  try {
    const pathname = new URL(url).pathname
    const raw = pathname.split('/').pop()
    if (raw && raw.length > 0) {
      const decoded = decodeURIComponent(raw)
      // If it looks like a clean filename with extension, return it
      if (decoded.includes('.')) {
        return decoded
      }
      // If no extension but fallback provided, use fallback
      if (fallback) return fallback
      return decoded
    }
  } catch {
    // fallback
  }
  return fallback || 'document_attachment'
}

export function AttachmentCard({ url, label = 'Attached File', filename, className = '' }: AttachmentCardProps) {
  if (!url) return null

  const isExternalLink =
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    url.includes('dropbox.com')

  const resolvedName = extractFilename(url, filename)
  const isPdf = url.toLowerCase().includes('.pdf') || resolvedName.toLowerCase().endsWith('.pdf')
  const previewUrl = isExternalLink ? (getSafeExternalUrl(url) || url) : getFileProxyUrl(url, resolvedName, false, isPdf ? 'pdf' : undefined)
  const downloadUrl = isExternalLink ? (getSafeExternalUrl(url) || url) : getFileProxyUrl(url, resolvedName, true, isPdf ? 'pdf' : undefined)

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2.5 rounded-lg shrink-0 ${isPdf ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
          <FileTextIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted">{label}</p>
          <p className="text-sm font-medium text-text truncate max-w-xs sm:max-w-sm md:max-w-md" title={resolvedName}>
            {resolvedName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="Open in browser for viewing"
        >
          <ExternalLinkIcon className="h-3.5 w-3.5" />
          {isExternalLink ? 'Open Link' : 'Preview'}
        </a>
        {!isExternalLink && (
          <a
            href={downloadUrl}
            download={resolvedName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-hover border border-border text-text hover:bg-surface-active transition-colors"
            title="Download file to your device"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Download
          </a>
        )}
      </div>
    </div>
  )
}
