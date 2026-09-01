import { Badge } from '@/components'
import { ClockIcon, CheckCircleIcon, AlertCircleIcon, AwardIcon } from '@/components/ui/icons'
import type { Submission } from '@/types/submission'
import { getSafeExternalUrl } from '@/utils'

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function mapStatusBadge(status: string) {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted', variant: 'success' as const }
    case 'graded':
      return { label: 'Graded', variant: 'default' as const }
    case 'late':
      return { label: 'Late', variant: 'warning' as const }
    case 'pending':
    default:
      return { label: 'Pending', variant: 'neutral' as const }
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'submitted':
      return <CheckCircleIcon className="h-4 w-4 text-success" />
    case 'graded':
      return <AwardIcon className="h-4 w-4 text-primary" />
    case 'late':
      return <AlertCircleIcon className="h-4 w-4 text-accent" />
    case 'pending':
    default:
      return <ClockIcon className="h-4 w-4 text-text-muted" />
  }
}

interface SubmissionStatusProps {
  submission: Submission
}

export function SubmissionStatus({ submission }: SubmissionStatusProps) {
  const statusBadge = mapStatusBadge(submission.status)
  const isGraded = submission.status === 'graded'
  const hasMarks = submission.marks !== null && submission.marks !== undefined
  const hasFeedback = submission.feedback && submission.feedback.trim().length > 0
  const attachmentUrl = getSafeExternalUrl(submission.attachmentUrl)

  return (
    <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(submission.status)}
          <h2 className="text-sm font-semibold text-text">Your Submission</h2>
        </div>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-text-muted">Submitted On</p>
          <p className="mt-0.5 text-sm font-medium text-text">{formatDate(submission.submittedAt)}</p>
        </div>

        {submission.content && (
          <div>
            <p className="text-xs text-text-muted">Your Answer</p>
            <div className="mt-1.5 rounded-lg border border-border bg-surface p-3">
              <p className="text-sm text-text whitespace-pre-wrap">{submission.content}</p>
            </div>
          </div>
        )}

        {attachmentUrl && (
          <div>
            <p className="text-xs text-text-muted">Attachment</p>
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              View Submitted File
            </a>
          </div>
        )}

        {isGraded && (
          <div className="grid gap-4 sm:grid-cols-2">
            {hasMarks && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs text-text-muted">Marks Obtained</p>
                <p className="mt-1 text-lg font-bold text-text">
                  {submission.marks}
                  {submission.assignmentId?.totalMarks != null && (
                    <span className="text-sm font-normal text-text-muted">
                      {' '}/ {submission.assignmentId.totalMarks}
                    </span>
                  )}
                </p>
              </div>
            )}
            {hasFeedback && (
              <div className="rounded-lg border border-border bg-surface p-4 sm:col-span-2">
                <p className="text-xs text-text-muted">Feedback</p>
                <p className="mt-1.5 text-sm text-text whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
