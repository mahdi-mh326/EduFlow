import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { toast } from 'react-hot-toast'
import { uploadApi } from '@/services/api/upload'
import { SpinnerIcon, TrashIcon, CheckCircleIcon, FileTextIcon } from './icons'


export interface FileUploadDropzoneProps {
  value?: string
  onChange: (url: string, fileType?: string, originalName?: string) => void
  onRemove?: () => void
  folder?: string
  accept?: string
  maxSizeMb?: number
  label?: string
  hint?: string
  className?: string
}

export function FileUploadDropzone({
  value,
  onChange,
  onRemove,
  folder = 'eduflow/materials',
  accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg,.webp',
  maxSizeMb = 25,
  label = 'Upload File',
  hint = 'Drag & drop your file here, or click to browse (PDF, Word, Images, Zip up to 25MB)',
  className = '',
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedName, setUploadedName] = useState<string>('')
  const [uploadedSize, setUploadedSize] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxSizeMb}MB.`)
      return
    }

    setUploading(true)
    try {
      const res = await uploadApi.uploadFile(file, folder)
      setUploadedName(res.originalName || file.name)
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      setUploadedSize(sizeStr)
      onChange(res.url, res.fileType, res.originalName)
      toast.success('File uploaded successfully!')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to upload file. Please try again.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0])
    }
  }

  const handleRemove = () => {
    setUploadedName('')
    setUploadedSize('')
    onChange('')
    onRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-semibold text-text">{label}</label>}

      {value ? (
        /* File Uploaded Preview Card */
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3.5 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
              <CheckCircleIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-text">
                {uploadedName || value.split('/').pop() || 'Uploaded File'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-text-muted">
                {uploadedSize && <span>{uploadedSize}</span>}
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  View / Download ↗
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-error transition-colors"
            title="Remove File"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/10 shadow-md scale-[1.01]'
              : 'border-border bg-surface-hover/30 hover:border-primary/50 hover:bg-surface-hover/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <SpinnerIcon className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-semibold text-text">Uploading to Cloud Storage...</p>
              <p className="text-[11px] text-text-muted">Please wait a moment</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileTextIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-text">
                  <span className="text-primary hover:underline">Click to browse</span> or drag and drop
                </p>
                <p className="mt-1 text-[11px] text-text-muted max-w-xs">{hint}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
