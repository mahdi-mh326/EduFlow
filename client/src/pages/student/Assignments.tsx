import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Pagination, Container, SearchInput } from '@/components'
import { assignmentApi } from '@/services/api/assignment'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  InboxIcon,
  FileTextIcon,
  AlertCircleIcon,
} from '@/components/ui/icons'
import type { Assignment, GetAssignmentsParams } from '@/types/assignment'

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

function mapStatusBadge(status: string) {
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

export function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadAssignments = useCallback(async (params?: GetAssignmentsParams) => {
    setLoading(true)
    setError(null)
    try {
      const result = await assignmentApi.getAssignments({
        page: 1,
        limit: 10,
        sortBy: 'newest',
        sortOrder: 'desc',
        ...params,
      })
      setAssignments(result.data)
      setMeta(result.meta)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load assignments. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value)
      loadAssignments({ search: value || undefined })
    },
    [loadAssignments],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      loadAssignments({ page, search: searchQuery || undefined })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [loadAssignments, searchQuery],
  )

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton variant="text" height="1.25rem" width="250px" />
                  <Skeleton variant="text" height="0.875rem" width="180px" />
                  <Skeleton variant="text" height="0.875rem" width="300px" />
                </div>
                <Skeleton variant="rect" height="2rem" width="100px" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Assignments</h1>
          <p className="mt-1 text-sm text-text-muted">View your upcoming and previous assignments.</p>
        </div>
        <ErrorState title="Unable to load assignments" message={error} onRetry={() => loadAssignments()} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Assignments</h1>
        <p className="mt-1 text-sm text-text-muted">View your upcoming and previous assignments.</p>
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search assignments..."
          className="max-w-md"
        />
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assignments for your enrolled courses will appear here."
          icon={<InboxIcon className="h-12 w-12" />}
          action={
            <Link to="/courses">
              <Button variant="primary">Browse Courses</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const course = assignment.courseId
            const cls = assignment.classId
            const teacher = assignment.teacherId
            const statusBadge = mapStatusBadge(assignment.status)
            const dueDateInfo = getDueDateLabel(assignment.dueDate)

            return (
              <div
                key={assignment._id}
                className="rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-1 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileTextIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">{assignment.title}</h3>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        {dueDateInfo.isOverdue && (
                          <Badge variant="error">
                            <span className="flex items-center gap-1">
                              <AlertCircleIcon className="h-3 w-3" />
                              Overdue
                            </span>
                          </Badge>
                        )}
                      </div>

                      {assignment.description && (
                        <p className="mt-1.5 text-xs text-text-muted line-clamp-2">{assignment.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <BookOpenIcon className="h-3.5 w-3.5" />
                          {course?.title || 'Course N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-3.5 w-3.5" />
                          {cls?.batchName || 'Class N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          <span className={dueDateInfo.isOverdue ? 'text-error font-medium' : ''}>
                            {dueDateInfo.label}
                          </span>
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span>
                          Instructor:{' '}
                          <span className="font-medium text-text">{teacher?.fullName || 'TBD'}</span>
                        </span>
                        <span>
                          Total Marks:{' '}
                          <span className="font-medium text-text">{assignment.totalMarks}</span>
                        </span>
                        <span>
                          Due:{' '}
                          <span className="font-medium text-text">{formatDate(assignment.dueDate)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <Link to={`/student/assignments/${assignment._id}`}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </Container>
  )
}
