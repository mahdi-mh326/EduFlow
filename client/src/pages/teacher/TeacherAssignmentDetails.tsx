import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  ChevronLeftIcon,
  InboxIcon,
  FileTextIcon,
} from '@/components/ui/icons'
import type { TeacherAssignment, TeacherSubmission } from '@/types/teacher'
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

function getStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'default'
    case 'closed':
      return 'warning'
    default:
      return 'default'
  }
}

export function TeacherAssignmentDetails() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null)
  const [submissions, setSubmissions] = useState<TeacherSubmission[]>([])
  const [gradingSubmission, setGradingSubmission] = useState<TeacherSubmission | null>(null)
  const [marks, setMarks] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>('')
  const [submittingGrade, setSubmittingGrade] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [assignmentData, submissionsData] = await Promise.all([
        teacherApi.getAssignmentById(assignmentId || ''),
        teacherApi.getSubmissions(assignmentId || ''),
      ])
      setAssignment(assignmentData as any)
      setSubmissions(submissionsData.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load assignment details.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [assignmentId])

  const openGradeModal = (submission: TeacherSubmission) => {
    setGradingSubmission(submission)
    setMarks(submission.marks ?? 0)
    setFeedback(submission.feedback || '')
  }

  const handleSaveGrade = async (e?: React.FormEvent, gradeNext: boolean = false) => {
    if (e) e.preventDefault()
    if (!assignmentId || !gradingSubmission) return

    if (marks < 0 || (assignment && marks > assignment.totalMarks)) {
      toast.error(`Marks must be between 0 and ${assignment?.totalMarks || 100}`)
      return
    }

    setSubmittingGrade(true)
    try {
      await teacherApi.gradeSubmission(assignmentId, gradingSubmission._id, {
        marks,
        feedback,
      })

      // Update in local state for instantaneous feedback
      const updatedSubmissions = submissions.map((s) =>
        s._id === gradingSubmission._id
          ? {
              ...s,
              marks,
              feedback,
              status: 'graded' as const,
              gradedAt: new Date().toISOString(),
            }
          : s
      )
      setSubmissions(updatedSubmissions)

      if (gradeNext) {
        // Find next submission that is still pending or not the current one
        const remainingPending = updatedSubmissions.filter(
          (s) => s.status !== 'graded' && s._id !== gradingSubmission._id
        )
        if (remainingPending.length > 0) {
          const next = remainingPending[0]
          toast.success(`Grade saved! Next student: ${next.studentId?.fullName || 'Student'}`)
          openGradeModal(next)
        } else {
          toast.success('Grade saved! All pending submissions completed! 🎉')
          setGradingSubmission(null)
        }
      } else {
        toast.success('Submission graded successfully')
        setGradingSubmission(null)
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to grade submission.'
      toast.error(message)
    } finally {
      setSubmittingGrade(false)
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="text" height="1.5rem" width="120px" className="mb-2" />
          <Skeleton variant="text" height="2rem" width="300px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="100px" className="mb-3" />
              <Skeleton variant="text" height="2rem" width="60px" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <Skeleton variant="text" height="1.5rem" width="180px" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height="60px" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load assignment"
          message={error || 'Assignment not found.'}
          onRetry={loadData}
          secondaryAction={
            <Link to={assignment?.classId?._id ? `/teacher/classes/${assignment.classId._id}` : '/teacher/classes'}>
              <Button variant="primary">Back to Class</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const attachmentUrl = getSafeExternalUrl(assignment.attachmentUrl)
  const backUrl = assignment.classId?._id ? `/teacher/classes/${assignment.classId._id}` : '/teacher/classes'

  const pendingSubmissions = submissions.filter((s) => s.status !== 'graded')
  const gradedSubmissions = submissions.filter((s) => s.status === 'graded')

  const filteredSubmissions = submissions.filter((s: TeacherSubmission) => {
    if (statusFilter === 'pending' && s.status === 'graded') return false
    if (statusFilter === 'graded' && s.status !== 'graded') return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const name = s.studentId?.fullName?.toLowerCase() || ''
      const email = s.studentId?.email?.toLowerCase() || ''
      return name.includes(q) || email.includes(q)
    }
    return true
  })

  return (

    <div className="space-y-6">
      <div className="space-y-3">
        <Link to={backUrl} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Class Details
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">{assignment.title}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {assignment.courseId?.title || 'Course'} • {assignment.classId?.batchName || 'Class'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status" value={assignment.status || 'N/A'} icon={<FileTextIcon className="h-5 w-5 text-primary" />} badge />
        <StatCard label="Total Marks" value={assignment.totalMarks.toString()} icon={<BookOpenIcon className="h-5 w-5 text-secondary" />} />
        <StatCard label="Submissions" value={submissions.length.toString()} icon={<UsersIcon className="h-5 w-5 text-accent" />} />
        <StatCard label="Due Date" value={formatDate(assignment.dueDate)} icon={<ClockIcon className="h-5 w-5 text-success" />} />
      </div>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Assignment Details</h2>
        <div className="space-y-4">
          {assignment.description && (
            <div>
              <p className="text-xs text-text-muted mb-1">Description</p>
              <p className="text-sm text-text whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}
          {assignment.instructions && (
            <div>
              <p className="text-xs text-text-muted mb-1">Instructions</p>
              <p className="text-sm text-text whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}
          {attachmentUrl && (
            <div>
              <p className="text-xs text-text-muted mb-1">Attachment</p>
              <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {attachmentUrl}
              </a>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-muted">Course</p>
              <p className="font-medium text-text">{assignment.courseId?.title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Batch</p>
              <p className="font-medium text-text">{assignment.classId?.batchName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Created</p>
              <p className="font-medium text-text">{formatDate(assignment.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Last Updated</p>
              <p className="font-medium text-text">{formatDate(assignment.updatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text">Submissions</h2>
            <p className="text-xs text-text-muted">
              {filteredSubmissions.length} of {submissions.length} submissions shown
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Pending Review ({pendingSubmissions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('graded')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'graded'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Graded ({gradedSubmissions.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4 max-w-sm">
          <input
            type="text"
            placeholder="Search student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {filteredSubmissions.length === 0 ? (
          <EmptyState
            title={searchQuery || statusFilter !== 'all' ? 'No matching submissions found' : 'No submissions yet'}
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Try changing the filter or search query.'
                : 'Student submissions will appear here.'
            }
            icon={<InboxIcon className="h-12 w-12" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] divide-y divide-border">
              <thead>
                <tr className="bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Marks</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Feedback</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filteredSubmissions.map((submission) => {
                  return (
                    <tr key={submission._id} className="hover:bg-background transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {submission.studentId?.fullName?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text truncate">{submission.studentId?.fullName}</p>
                            <p className="text-xs text-text-muted truncate">{submission.studentId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getSubmissionStatusVariant(submission.status)} className="capitalize">
                          {submission.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">{formatDateTime(submission.submittedAt)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {submission.marks !== null && submission.marks !== undefined ? `${submission.marks} / ${assignment.totalMarks}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted max-w-[200px] truncate">{submission.feedback || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={submission.status === 'graded' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => openGradeModal(submission)}
                        >
                          {submission.status === 'graded' ? 'Edit Grade' : 'Grade'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text mb-2">Grade Submission</h3>
            <p className="text-sm text-text-muted mb-4">
              Student: <span className="font-medium text-text">{gradingSubmission.studentId?.fullName}</span> ({gradingSubmission.studentId?.email})
            </p>

            {gradingSubmission.content && (
              <div className="mb-4 rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium text-text-muted mb-1">Submission Content</p>
                <p className="text-sm text-text whitespace-pre-wrap">{gradingSubmission.content}</p>
              </div>
            )}

            {gradingSubmission.attachmentUrl && (
              <div className="mb-4 rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium text-text-muted mb-1">Attachment</p>
                <a
                  href={getSafeExternalUrl(gradingSubmission.attachmentUrl) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {gradingSubmission.attachmentUrl}
                </a>
              </div>
            )}

            <form onSubmit={(e) => handleSaveGrade(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Marks (out of {assignment.totalMarks}) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={assignment.totalMarks}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback to the student..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setGradingSubmission(null)}
                  disabled={submittingGrade}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  {submissions.some((s) => s.status !== 'graded' && s._id !== gradingSubmission._id) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSaveGrade(undefined, true)}
                      loading={submittingGrade}
                      className="border-primary text-primary font-bold hover:bg-primary/10"
                    >
                      Save & Next →
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submittingGrade}
                  >
                    Save Grade
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({ label, value, icon, badge }: { label: string; value: string; icon: React.ReactNode; badge?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
          {icon}
        </div>
        <div>
          <p className="text-xs text-text-muted">{label}</p>
          {badge ? (
            <Badge variant={getStatusVariant(value)} className="capitalize mt-1">{value}</Badge>
          ) : (
            <p className="text-xl font-bold text-text">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getSubmissionStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'graded':
      return 'success'
    case 'submitted':
      return 'default'
    case 'late':
      return 'warning'
    case 'pending':
      return 'neutral'
    default:
      return 'default'
  }
}

