import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState, SearchInput, Select, Pagination } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import { useAuthStore } from '@/stores/auth.store'
import {
  UsersIcon,
  ClockIcon,
  InboxIcon,
} from '@/components/ui/icons'
import type { TeacherClass } from '@/types/teacher'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(time: string) {
  if (!time) return 'N/A'
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function getStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'ongoing':
      return 'success'
    case 'upcoming':
      return 'default'
    case 'completed':
      return 'primary'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

export function TeacherClasses() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadClasses = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await teacherApi.getClasses({
        page,
        limit: 10,
        teacherId: user?.id,
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      setClasses(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load classes. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses(1)
  }, [statusFilter])

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes
    const query = search.toLowerCase().trim()
    return classes.filter((cls) => {
      const courseTitle = cls.courseId?.title?.toLowerCase() || ''
      const batchName = cls.batchName?.toLowerCase() || ''
      return courseTitle.includes(query) || batchName.includes(query)
    })
  }, [classes, search])

  if (loading && classes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton variant="rect" height="40px" className="flex-1" />
          <Skeleton variant="rect" height="40px" width="160px" />
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

  if (error && classes.length === 0) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load classes"
          message={error}
          onRetry={() => loadClasses(currentPage)}
          secondaryAction={
            <Button variant="primary" onClick={() => loadClasses(currentPage)}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text sm:text-3xl">My Classes</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage and view all classes assigned to you.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by course or batch name..."
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
        {filteredClasses.map((cls) => {
          const totalStudentsInClass = cls.sections?.reduce((sum, s) => sum + (s.currentStudents || 0), 0) || 0

          return (

            <div
              key={cls._id}
              className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text truncate">{cls.courseId?.title || 'Course'}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{cls.batchName}</p>
                </div>
                <Badge variant={getStatusVariant(cls.status)} className="capitalize shrink-0">
                  {cls.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-text-muted mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatDate(cls.startDate)} – {formatDate(cls.endDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{cls.classDays?.join(', ') || 'No days'} • {formatTime(cls.startTime)} – {formatTime(cls.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{totalStudentsInClass} Enrolled Students</span>
                </div>

              </div>

              <div className="mt-auto">
                <Link to={`/teacher/classes/${cls._id}`}>
                  <Button variant="primary" size="sm" className="w-full">
                    View Class
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {filteredClasses.length === 0 && !loading && (
        <EmptyState
          title="No classes found"
          description={search || statusFilter ? 'Try changing your search or filters.' : 'No classes assigned yet.'}
          icon={<InboxIcon className="h-12 w-12" />}
        />
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadClasses(page)}
          />
        </div>
      )}
    </div>
  )
}

function CalendarIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}
