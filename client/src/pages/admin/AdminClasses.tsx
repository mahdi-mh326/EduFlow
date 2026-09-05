import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, EmptyState, Container, Select, ConfirmDialog, Pagination } from '@/components'
import { adminApi } from '@/services/api/admin'
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  InboxIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
} from '@/components/ui/icons'
import type { AdminClass } from '@/types/admin'
import { AdminClassForm } from './AdminClassForm'

const CLASS_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AdminClasses() {
  const [classes, setClasses] = useState<AdminClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState<AdminClass | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([])
  const [teachers, setTeachers] = useState<Array<{ _id: string; fullName: string }>>([])

  const loadCoursesAndTeachers = async () => {
    try {
      const [coursesRes, teachersRes] = await Promise.all([
        adminApi.getCourses({ limit: 100 }),
        adminApi.getTeachers({ limit: 100 }),
      ])
      setCourses((coursesRes.data || []).map((c: any) => ({ _id: c._id, title: c.title })))
      setTeachers((teachersRes.data || []).map((t: any) => ({ _id: t._id, fullName: t.fullName })))
    } catch {
      // ignore
    }
  }

  const loadClasses = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getClasses({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        sortBy: 'newest',
        sortOrder: 'desc',
      })
      setClasses(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load classes. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoursesAndTeachers()
    loadClasses(1)
  }, [search, statusFilter])

  const handleCreate = async () => {
    await loadCoursesAndTeachers()
    setEditingClass(null)
    setShowForm(true)
  }

  const handleEdit = async (cls: AdminClass) => {
    await loadCoursesAndTeachers()
    setEditingClass(cls)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await adminApi.deleteClass(deletingId)
      toast.success('Class deleted successfully')
      setDeletingId(null)
      loadClasses(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete class.'
      toast.error(message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingClass(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingClass(null)
    loadClasses(currentPage)
  }

  if (loading && classes.length === 0) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1.25rem" width="250px" className="mb-3" />
              <Skeleton variant="text" height="0.875rem" width="180px" />
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (error && classes.length === 0) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Classes</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all classes across courses.</p>
        </div>
        <ErrorState title="Unable to load classes" message={error} onRetry={() => loadClasses(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Classes</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all classes across courses.</p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search classes..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={CLASS_STATUSES} className="w-full sm:w-40" />
      </div>

      {classes.length === 0 ? (
        <EmptyState
          title="No classes found"
          description={search || statusFilter ? 'Try adjusting your filters.' : 'Create your first class to get started.'}
          icon={<InboxIcon className="h-12 w-12" />}
          action={!search && !statusFilter ? (
            <Button variant="primary" onClick={handleCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-text">{cls.batchName}</h3>
                    <Badge variant={cls.status === 'ongoing' ? 'success' : cls.status === 'upcoming' ? 'default' : cls.status === 'completed' ? 'primary' : 'warning'} className="capitalize">
                      {cls.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span className="font-semibold text-text">{cls.courseId?.title || 'Untitled Course'}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <UsersIcon className="h-3.5 w-3.5" />
                      <span>{cls.teacherId?.fullName || 'Unassigned Instructor'}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 text-xs text-text-muted bg-slate-100 rounded-lg px-2.5 py-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>
                        {cls.startDate ? new Date(cls.startDate).toLocaleDateString() : 'N/A'} - {cls.endDate ? new Date(cls.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs text-text-muted bg-slate-100 rounded-lg px-2.5 py-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>{cls.startTime} - {cls.endTime}</span>
                    </div>
                  </div>
                  {cls.classDays && cls.classDays.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-text-muted mr-1 font-medium">Class Days:</span>
                      {cls.classDays.map((day) => (
                        <span
                          key={day}
                          className="rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Seat Occupancy Meter */}
                  {(() => {
                    const capacity = cls.capacity || 30
                    const current = cls.currentStudents || 0
                    const percent = Math.min(100, Math.round((current / capacity) * 100))
                    const isFull = current >= capacity
                    const isNearFull = percent >= 80

                    return (
                      <div className="mt-3.5 max-w-sm rounded-xl border border-border bg-background/60 p-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-text flex items-center gap-1.5">
                            <UsersIcon className="h-3.5 w-3.5 text-text-muted" />
                            <span>Seat Occupancy</span>
                            {isFull ? (
                              <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                                Batch Full
                              </span>
                            ) : isNearFull ? (
                              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                                Filling Fast
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                                Enrolling
                              </span>
                            )}
                          </span>
                          <span className="font-bold text-text">
                            {current} / {capacity} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull
                                ? 'bg-rose-500'
                                : isNearFull
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(cls)} aria-label="Edit class">
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingId(cls._id)} aria-label="Delete class">
                    <TrashIcon className="h-4 w-4 text-error" />
                  </Button>
                </div>
              </div>
            </div>

          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(page) => loadClasses(page)} />
        </div>
      )}

      <AdminClassForm
        open={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        classData={editingClass}
        courses={courses}
        teachers={teachers}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </Container>
  )
}
