import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState, SearchInput, Select, Pagination, ConfirmDialog } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import {
  PlusIcon,
  FileTextIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
} from '@/components/ui/icons'
import type { TeacherQuiz } from '@/types/teacher'
import { TeacherQuizForm } from './TeacherQuizForm'

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

export function TeacherQuizzes() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<TeacherQuiz | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadQuizzes = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await teacherApi.getQuizzes({
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      setQuizzes(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load quizzes. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuizzes(1)
  }, [statusFilter])

  const filteredQuizzes = useMemo(() => {
    if (!search.trim()) return quizzes
    const query = search.toLowerCase().trim()
    return quizzes.filter((q) => {
      const title = q.title?.toLowerCase() || ''
      const course = q.courseId?.title?.toLowerCase() || ''
      const batch = q.classId?.batchName?.toLowerCase() || ''
      return title.includes(query) || course.includes(query) || batch.includes(query)
    })
  }, [quizzes, search])

  const handleCreate = () => {
    setEditingQuiz(null)
    setShowForm(true)
  }

  const handleEdit = (quiz: TeacherQuiz) => {
    setEditingQuiz(quiz)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await teacherApi.deleteQuiz(deletingId)
      toast.success('Quiz deleted successfully')
      setDeletingId(null)
      loadQuizzes(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete quiz.'
      toast.error(message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingQuiz(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingQuiz(null)
    loadQuizzes(currentPage)
  }

  if (loading && quizzes.length === 0) {
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

  if (error && quizzes.length === 0) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load quizzes"
          message={error}
          onRetry={() => loadQuizzes(currentPage)}
          secondaryAction={
            <Button variant="primary" onClick={() => loadQuizzes(currentPage)}>
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
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Quizzes</h1>
          <p className="mt-1 text-sm text-text-muted">
            Create and manage quizzes for your classes.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Quiz
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
        {filteredQuizzes.map((quiz) => {
          const isExpired = new Date(quiz.endDate) < new Date() && quiz.status !== 'closed'

          return (
            <div
              key={quiz._id}
              className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text truncate">{quiz.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {quiz.courseId?.title || 'Course'} • {quiz.classId?.batchName || 'Class'}
                  </p>
                </div>
                <Badge variant={getStatusVariant(quiz.status)} className="capitalize shrink-0">
                  {quiz.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-text-muted mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className={isExpired ? 'text-error font-medium' : ''}>
                    {formatDate(quiz.startDate)} – {formatDate(quiz.endDate)}
                    {isExpired && ' (Expired)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{quiz.durationMinutes} min • {quiz.attemptLimit} attempt{quiz.attemptLimit !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{quiz.totalMarks} marks • Pass: {quiz.passingMarks}</span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <Link to={`/teacher/quizzes/${quiz._id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(quiz)} aria-label="Edit quiz">
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeletingId(quiz._id)} aria-label="Delete quiz">
                  <TrashIcon className="h-4 w-4 text-error" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredQuizzes.length === 0 && !loading && (
        <EmptyState
          title="No quizzes found"
          description={search || statusFilter ? 'Try changing your search or filters.' : 'Create your first quiz to get started.'}
          icon={<FileTextIcon className="h-12 w-12" />}
          action={!search && !statusFilter ? (
            <Button variant="primary" onClick={handleCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          ) : undefined}
        />
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadQuizzes(page)}
          />
        </div>
      )}

      {showForm && (
        <TeacherQuizForm
          open={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          quiz={editingQuiz}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
