import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { assignmentApi } from '@/services/api/assignment'
import { submissionApi } from '@/services/api/submission'
import { SubmissionForm, SubmissionStatus } from '@/components/submission'
import { toast } from 'react-hot-toast'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon,
  ChevronLeftIcon,
} from '@/components/ui/icons'
import type { Assignment } from '@/types/assignment'
import type { Submission } from '@/types/submission'
import { getSafeExternalUrl } from '@/utils'

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateString: string) {
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

function getDueDateLabel(dueDate: string): { label: string; isOverdue: boolean } {
  const now = new Date()
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return { label: 'N/A', isOverdue: false }

  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) return { label: 'Overdue', isOverdue: true }
  if (diffDays === 0) return { label: 'Due today', isOverdue: false }
  if (diffDays === 1) return { label: 'Due tomorrow', isOverdue: false }
  return { label: `Due in ${diffDays} days`, isOverdue: false }
}

function mapAssignmentStatusBadge(status: string) {
  switch (status) {
    case 'published':
      return { label: 'Active', variant: 'default' as const }
    case 'closed':
      return { label: 'Closed', variant: 'warning' as const }
    case 'draft':
      return { label: 'Draft', variant: 'neutral' as const }
    default:
      return { label: status, variant: 'default' as const }
  }
}

function isDeadlinePassed(dueDate: string): boolean {
  const now = new Date()
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return false
  return due.getTime() <= now.getTime()
}

export function AssignmentDetails() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loadingAssignment, setLoadingAssignment] = useState(true)
  const [loadingSubmission, setLoadingSubmission] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)

  const loadAssignment = useCallback(async () => {
    if (!assignmentId) return
    setLoadingAssignment(true)
    setError(null)
    setAccessDenied(false)
    try {
      const data = await assignmentApi.getAssignmentById(assignmentId)
      setAssignment(data)
    } catch (err: any) {
      const status = err?.response?.status
      const message = err?.response?.data?.message || 'Unable to load this assignment.'

      if (status === 403) {
        setAccessDenied(true)
        setError('You do not have permission to view this assignment.')
      } else if (status === 404) {
        setError('This assignment was not found or may have been removed.')
      } else {
        setError(message)
      }
    } finally {
      setLoadingAssignment(false)
    }
  }, [assignmentId])

  const loadSubmission = useCallback(async () => {
    if (!assignmentId) return
    setLoadingSubmission(true)
    setSubmissionError(null)
    try {
      const data = await submissionApi.getMySubmission(assignmentId)
      setSubmission(data)
      setEditing(false)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) {
        setSubmission(null)
        setEditing(false)
      } else if (status === 403) {
        setSubmissionError('You do not have permission to view this submission.')
      } else {
        const message = err?.response?.data?.message || 'Unable to load your submission.'
        setSubmissionError(message)
      }
    } finally {
      setLoadingSubmission(false)
    }
  }, [assignmentId])

  useEffect(() => {
    loadAssignment()
  }, [loadAssignment])

  useEffect(() => {
    if (assignment) {
      loadSubmission()
    }
  }, [assignment, loadSubmission])

  const handleSubmit = async (payload: { content: string; attachmentUrl?: string }) => {
    if (!assignmentId || submitting) return
    setSubmitting(true)
    setSubmissionError(null)

    try {
      const result = await submissionApi.createSubmission(assignmentId, payload)
      setSubmission(result)
      setEditing(false)
      toast.success('Assignment submitted successfully!')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to submit assignment. Please try again.'
      setSubmissionError(message)
      toast.error(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }


  const handleEdit = () => {
    setEditing(true)
    setSubmissionError(null)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setSubmissionError(null)
  }

  const handleRetrySubmission = () => {
    loadSubmission()
  }

  if (loadingAssignment) {
    return (
      <Container className="py-8">
        <div className="mb-4">
          <Skeleton variant="text" height="1rem" width="150px" className="mb-2" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="text" height="2rem" width="350px" />
          <Skeleton variant="text" height="1rem" width="500px" />
          <div className="rounded-xl border border-border bg-surface p-6 mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton variant="text" height="0.875rem" width="100px" />
                  <Skeleton variant="text" height="1rem" width="200px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    )
  }

  if (accessDenied || error) {
    return (
      <Container className="py-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/student/assignments')}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Assignments
          </button>
        </div>
        {accessDenied ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <AlertCircleIcon className="mx-auto h-12 w-12 text-accent" />
            <h2 className="mt-4 text-lg font-semibold text-text">Access Restricted</h2>
            <p className="mt-2 text-sm text-text-muted">
              You do not have permission to view this assignment. Make sure you are enrolled in the
              relevant class.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/student/assignments')}>
                View Assignments
              </Button>
              <Link to="/student/enrollments">
                <Button variant="primary">My Enrollments</Button>
              </Link>
            </div>
          </div>
        ) : (
        <ErrorState
          title="Unable to load this assignment"
          message={error || undefined}
          onRetry={loadAssignment}
          secondaryAction={
            <Button variant="outline" onClick={() => navigate('/student/assignments')}>
              View Assignments
            </Button>
          }
        />
        )}
      </Container>
    )
  }

  if (!assignment) {
    return (
      <Container className="py-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/student/assignments')}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Assignments
          </button>
        </div>
        <EmptyState
          title="Assignment not found"
          description="This assignment may have been removed or is no longer available."
          icon={<FileTextIcon className="h-12 w-12" />}
          action={
            <Button variant="primary" onClick={() => navigate('/student/assignments')}>
              View Assignments
            </Button>
          }
        />
      </Container>
    )
  }

  const course = assignment.courseId
  const cls = assignment.classId
  const attachmentUrl = getSafeExternalUrl(assignment.attachmentUrl)
  const statusBadge = mapAssignmentStatusBadge(assignment.status)
  const dueDateInfo = getDueDateLabel(assignment.dueDate)
  const deadlinePassed = isDeadlinePassed(assignment.dueDate)
  const submissionBlocked = assignment.status === 'closed' || deadlinePassed

  return (
    <Container className="py-8">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate('/student/assignments')}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Assignments
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          {dueDateInfo.isOverdue && (
            <Badge variant="error">
              <span className="flex items-center gap-1">
                <AlertCircleIcon className="h-3 w-3" />
                Overdue
              </span>
            </Badge>
          )}
          <span
            className={`text-xs font-medium ${dueDateInfo.isOverdue ? 'text-error' : 'text-text-muted'}`}
          >
            {dueDateInfo.label}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-text sm:text-3xl">{assignment.title}</h1>

        {assignment.description && (
          <p className="mt-3 text-sm text-text-muted leading-relaxed">{assignment.description}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            icon={<BookOpenIcon className="h-4 w-4 text-primary" />}
            label="Course"
            value={course?.title || 'N/A'}
          />
          <DetailItem
            icon={<UsersIcon className="h-4 w-4 text-primary" />}
            label="Class / Batch"
            value={cls?.batchName || 'N/A'}
          />
          <DetailItem
            icon={<ClockIcon className="h-4 w-4 text-primary" />}
            label="Due Date"
            value={formatDate(assignment.dueDate)}
          />
          <DetailItem label="Total Marks" value={`${assignment.totalMarks}`} />
          <DetailItem label="Created" value={formatDateTime(assignment.createdAt)} />
          <DetailItem label="Last Updated" value={formatDateTime(assignment.updatedAt)} />
        </div>

        {assignment.instructions && (
          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <h2 className="text-sm font-semibold text-text">Instructions</h2>
            <p className="mt-2 text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
              {assignment.instructions}
            </p>
          </div>
        )}

        {attachmentUrl && (
          <div className="mt-4">
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              <FileTextIcon className="h-4 w-4" />
              View Attachment
            </a>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-text mb-4">Submission</h2>

          {submissionBlocked && (
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-sm text-text-muted">
                {assignment.status === 'closed'
                  ? 'This assignment is closed and no longer accepts submissions.'
                  : 'The submission deadline for this assignment has passed.'}
              </p>
            </div>
          )}

          {!submissionBlocked && loadingSubmission && (
            <div className="rounded-xl border border-border bg-background p-5">
              <div className="space-y-3">
                <Skeleton variant="text" height="1.25rem" width="120px" />
                <Skeleton variant="text" height="0.875rem" width="100%" />
                <Skeleton variant="text" height="0.875rem" width="80%" />
                <Skeleton variant="rect" height="2.5rem" width="140px" />
              </div>
            </div>
          )}

          {!submissionBlocked && !loadingSubmission && submissionError && !submission && (
            <ErrorState
              title="Unable to load submission"
              message={submissionError || undefined}
              onRetry={handleRetrySubmission}
            />
          )}

          {!submissionBlocked && !loadingSubmission && !submission && !submissionError && (
            <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <SubmissionForm
                onSubmit={handleSubmit}
                submitting={submitting}
                helperText="Write your answer in the text area below and submit when ready."
              />
            </div>
          )}

          {!submissionBlocked && !loadingSubmission && submission && !editing && (
            <SubmissionStatus submission={submission} />
          )}

          {!submissionBlocked && !loadingSubmission && submission && editing && (
            <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text">Edit Submission</h3>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
              <SubmissionForm
                onSubmit={handleSubmit}
                initialContent={submission.content}
                initialAttachmentUrl={submission.attachmentUrl}
                submitting={submitting}
                submitLabel="Update Submission"
                helperText="Update your answer or replace your attached file."
              />

            </div>
          )}

          {!submissionBlocked && !loadingSubmission && submission && !editing && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                Edit Submission
              </Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-text-muted">{label}</p>
      </div>
      <p className="mt-1 text-sm font-medium text-text">{value}</p>
    </div>
  )
}
