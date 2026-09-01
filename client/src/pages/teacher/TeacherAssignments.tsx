import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState, SearchInput, Select, Pagination, ConfirmDialog } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import {
  FileTextIcon,
  ClockIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from '@/components/ui/icons'
import type { TeacherAssignment } from '@/types/teacher'
import { TeacherAssignmentForm } from './TeacherAssignmentForm'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
]

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

export function TeacherAssignments() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadAssignments = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await teacherApi.getAssignments({
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      setAssignments(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load assignments. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments(1)
  }, [statusFilter])

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) return assignments
    const query = search.toLowerCase().trim()
    return assignments.filter((a) => {
      const title = a.title?.toLowerCase() || ''
      const course = a.courseId?.title?.toLowerCase() || ''
      const batch = a.classId?.batchName?.toLowerCase() || ''
      return title.includes(query) || course.includes(query) || batch.includes(query)
    })
  }, [assignments, search])

  const handleCreate = () => {
    setEditingAssignment(null)
    setShowForm(true)
  }

  const handleEdit = (assignment: TeacherAssignment) => {
    setEditingAssignment(assignment)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await teacherApi.deleteAssignment(deletingId)
      toast.success('Assignment deleted successfully')
      setDeletingId(null)
      loadAssignments(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete assignment.'
      toast.error(message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingAssignment(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingAssignment(null)
    loadAssignments(currentPage)
  }

  if (loading && assignments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton variant="rect" height="40px" className="flex-1" />
          <Skeleton variant="rect" height="40px" width="160px" />
          <Skeleton variant="rect" height="40px" width="120px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1.25rem" width="70%" className="mb-3" />
              <Skeleton variant="text" height="1rem" width="50%" className="mb-2" />
              <Skeleton variant="text" height="1rem" width="40%" className="mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton variant="rect" height="32px" width="100px" />
                <Skeleton variant="text" height="1rem" width="80px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && assignments.length === 0) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load assignments"
          message={error}
          onRetry={() => loadAssignments(currentPage)}
          secondaryAction={
            <Button variant="primary" onClick={() => loadAssignments(currentPage)}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Assignments</h1>
          <p className="mt-1 text-sm text-text-muted">
            Create and manage assignments for your classes.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by title, course, or batch..."
          className="flex-1"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          className="sm:w-40"
        />
        {(search || statusFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.map((assignment) => {
          const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== 'closed'

          return (
            <div
              key={assignment._id}
              className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text truncate">{assignment.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {assignment.courseId?.title || 'Course'} • {assignment.classId?.batchName || 'Class'}
                  </p>
                </div>
                <Badge variant={getStatusVariant(assignment.status)} className="capitalize shrink-0">
                  {assignment.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-text-muted mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className={isOverdue ? 'text-error font-medium' : ''}>
                    Due {formatDate(assignment.dueDate)}
                    {isOverdue && ' (Overdue)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{assignment.totalMarks} marks</span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <Link to={`/teacher/assignments/${assignment._id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(assignment)} aria-label="Edit assignment">
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeletingId(assignment._id)} aria-label="Delete assignment">
                  <TrashIcon className="h-4 w-4 text-error" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredAssignments.length === 0 && !loading && (
        <EmptyState
          title="No assignments found"
          description={search || statusFilter ? 'Try changing your search or filters.' : 'Create your first assignment to get started.'}
          icon={<FileTextIcon className="h-12 w-12" />}
          action={!search && !statusFilter ? (
            <Button variant="primary" onClick={handleCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          ) : undefined}
        />
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadAssignments(page)}
          />
        </div>
      )}

      {showForm && (
        <TeacherAssignmentForm
          open={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          assignment={editingAssignment}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
