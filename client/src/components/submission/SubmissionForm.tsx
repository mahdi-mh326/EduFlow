import { useState, type FormEvent } from 'react'
import { Button, TextArea, ConfirmDialog, FileUploadDropzone } from '@/components'

export interface SubmissionPayload {
  content: string
  attachmentUrl?: string
}

interface SubmissionFormProps {
  onSubmit: (payload: SubmissionPayload) => Promise<void>
  initialContent?: string
  initialAttachmentUrl?: string
  submitLabel?: string
  submitting?: boolean
  helperText?: string
  confirmTitle?: string
  confirmMessage?: string
  confirmLabel?: string
  rows?: number
}

export function SubmissionForm({
  onSubmit,
  initialContent = '',
  initialAttachmentUrl = '',
  submitLabel = 'Submit Assignment',
  submitting = false,
  helperText,
  confirmTitle = 'Submit Assignment?',
  confirmMessage = 'Once submitted, your assignment will be sent to your teacher. Please review your answer and attached file before confirming.',
  confirmLabel = 'Submit Assignment',
  rows = 5,
}: SubmissionFormProps) {
  const [content, setContent] = useState(initialContent)
  const [attachmentUrl, setAttachmentUrl] = useState(initialAttachmentUrl)
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const trimmed = content.trim()
    if (!trimmed && !attachmentUrl) {
      setLocalError('Please write your answer or attach a file before submitting.')
      return
    }

    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    setIsSubmitting(true)
    setSubmitted(true)

    try {
      await onSubmit({
        content: content.trim(),
        attachmentUrl: attachmentUrl || undefined,
      })
    } catch {
      setSubmitted(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
  }

  if (submitted && !isSubmitting) {
    return null
  }

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <TextArea
          id="submission-content"
          label="Your Answer / Notes"
          placeholder="Write your submission notes or answers here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={rows}
          error={localError || undefined}
          helperText={helperText}
          disabled={submitting || isSubmitting}
        />

        <FileUploadDropzone
          label="Attached Assignment File (Direct Upload)"
          hint="Drop your homework file (PDF, Doc, Images, Zip up to 25MB) or click to browse"
          folder="eduflow/assignments"
          value={attachmentUrl}
          onChange={(url) => setAttachmentUrl(url)}
          onRemove={() => setAttachmentUrl('')}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting || submitting}
            disabled={isSubmitting || submitting}
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
          {(isSubmitting || submitting) && (
            <p className="text-xs text-text-muted">Please do not close this page while submitting.</p>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={showConfirm}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        cancelLabel="Cancel"
        loading={isSubmitting}
      />
    </>
  )
}
