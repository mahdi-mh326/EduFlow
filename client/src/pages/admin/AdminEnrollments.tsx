import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Button,
  Badge,
  Skeleton,
  ErrorState,
  EmptyState,
  Container,
  ConfirmDialog,
  Pagination,
  Modal,
} from '@/components'
import { adminApi } from '@/services/api/admin'
import { courseApi } from '@/services/api/course'
import { getAvatarUrl } from '@/utils'
import {
  TrashIcon,
  InboxIcon,
  SearchIcon,
  AlertCircleIcon,
  BookOpenIcon,
  LayersIcon,
  ZapIcon,
} from '@/components/ui/icons'
import type { AdminEnrollment, AdminClass } from '@/types/admin'


function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('')
  const [selectedBatchStatus, setSelectedBatchStatus] = useState('')

  // Modals
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [assigningEnrollment, setAssigningEnrollment] = useState<AdminEnrollment | null>(null)
  const [availableClasses, setAvailableClasses] = useState<AdminClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [assigningLoading, setAssigningLoading] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)

  const loadCourses = async () => {
    try {
      const res = await courseApi.getCourses({ limit: 100 })
      setCourses(res.data || [])
    } catch {
      // ignore
    }
  }

  const loadEnrollments = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getEnrollments({
        page,
        limit: 10,
        search: search.trim() || undefined,
        courseId: selectedCourseId || undefined,
        paymentStatus: selectedPaymentStatus || undefined,
        batchStatus: selectedBatchStatus || undefined,
      })

      setEnrollments(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load enrollments.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCourseId, selectedPaymentStatus, selectedBatchStatus])

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEnrollments(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [loadEnrollments])

  // Open Batch Assignment Modal
  const openAssignModal = async (enrollment: AdminEnrollment) => {
    setAssigningEnrollment(enrollment)
    setSelectedClassId(enrollment.classId?._id || '')
    setLoadingClasses(true)
    try {
      const courseId = (enrollment.courseId as any)?._id || (enrollment.courseId as any)
      const res = await adminApi.getClasses({ courseId, limit: 50 })
      setAvailableClasses(res.data || [])
      if (!enrollment.classId && res.data && res.data.length > 0) {
        setSelectedClassId(res.data[0]._id)
      }
    } catch {
      toast.error('Failed to load active batches for this course.')
    } finally {
      setLoadingClasses(false)
    }
  }

  // Handle Assign Batch Submit
  const handleAssignBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningEnrollment || !selectedClassId) {
      toast.error('Please select a class batch.')
      return
    }

    setAssigningLoading(true)
    try {
      await adminApi.assignClassToEnrollment(assigningEnrollment._id, selectedClassId)
      toast.success('Class batch successfully assigned!')
      setAssigningEnrollment(null)
      loadEnrollments(currentPage)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to assign class batch.'
      toast.error(msg)
    } finally {
      setAssigningLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await adminApi.deleteEnrollment(deletingId)
      toast.success('Enrollment deleted successfully')
      setDeletingId(null)
      loadEnrollments(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete enrollment.'
      toast.error(message)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCourseId('')
    setSelectedPaymentStatus('')
    setSelectedBatchStatus('')
  }

  const hasActiveFilters = Boolean(search || selectedCourseId || selectedPaymentStatus || selectedBatchStatus)

  // Quick stats calculation
  const totalCount = meta?.total || enrollments.length
  const unassignedCount = useMemo(() => {
    return enrollments.filter((e) => !e.classId).length
  }, [enrollments])

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Enrollments Management</h1>
          <p className="mt-1 text-sm text-text-muted">
            Track student course registrations, verify payments, and manage class batch assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" className="px-3 py-1 text-xs font-bold">
            Total Enrollments: {totalCount}
          </Badge>
          {unassignedCount > 0 && (
            <Badge variant="warning" className="px-3 py-1 text-xs font-bold animate-pulse">
              {unassignedCount} Pending Batch
            </Badge>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search student name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Course Filter */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Batch Status Filter */}
          <select
            value={selectedBatchStatus}
            onChange={(e) => setSelectedBatchStatus(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Batch Statuses</option>
            <option value="assigned">Assigned to Batch</option>
            <option value="unassigned">Pending Batch (Unassigned)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
            <span className="text-text-muted">Active search and filters applied</span>
            <button
              onClick={clearFilters}
              className="font-semibold text-primary hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && enrollments.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <Skeleton variant="text" height="1.25rem" width="220px" />
                  <Skeleton variant="text" height="0.875rem" width="300px" />
                </div>
                <Skeleton variant="rect" height="2rem" width="120px" className="rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error && enrollments.length === 0 ? (
        <ErrorState
          title="Unable to load enrollments"
          message={error}
          onRetry={() => loadEnrollments(currentPage)}
        />
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="No enrollments found"
          description={
            hasActiveFilters
              ? 'No enrollments match your current search and filter criteria.'
              : 'Student enrollments will appear here once learners enroll in courses.'
          }
          icon={<InboxIcon className="h-12 w-12" />}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const student = enrollment.studentId
            const course = enrollment.courseId
            const cls = enrollment.classId
            const hasBatch = Boolean(cls)

            return (
              <div
                key={enrollment._id}
                className={`rounded-2xl border bg-surface p-5 transition-all hover:shadow-sm ${
                  !hasBatch ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-border'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Left: Student & Course Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                      {student?.avatar ? (
                        <img src={getAvatarUrl(student.avatar)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        student?.fullName?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-text truncate">
                          {student?.fullName || 'Student N/A'}
                        </h3>
                        <Badge
                          variant={enrollment.paymentStatus === 'paid' ? 'success' : enrollment.paymentStatus === 'pending' ? 'warning' : 'error'}
                          className="capitalize text-[10px]"
                        >
                          Payment: {enrollment.paymentStatus}
                        </Badge>
                        <Badge
                          variant={enrollment.status === 'active' ? 'primary' : 'default'}
                          className="capitalize text-[10px]"
                        >
                          {enrollment.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-text-muted">
                        <span className="text-text font-medium">{student?.email}</span>
                        {student?.phone && <span> • {student.phone}</span>}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted pt-1">
                        <span className="font-semibold text-primary inline-flex items-center gap-1.5">
                          <BookOpenIcon className="h-3.5 w-3.5" />
                          <span>{course?.title || 'Course N/A'}</span>
                        </span>
                        {hasBatch ? (
                          <span className="font-medium text-text bg-surface px-2 py-0.5 rounded border border-border inline-flex items-center gap-1.5">
                            <LayersIcon className="h-3.5 w-3.5 text-secondary" />
                            <span>Batch: {cls?.batchName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                            <AlertCircleIcon className="h-3 w-3" />
                            Pending Batch Assignment
                          </span>
                        )}
                        <span>Enrolled on: {formatDate(enrollment.enrolledAt || enrollment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 md:self-center">
                    <Button
                      variant={!hasBatch ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => openAssignModal(enrollment)}
                      className="font-bold text-xs"
                    >
                      {!hasBatch ? (
                        <span className="inline-flex items-center gap-1">
                          <ZapIcon className="h-3.5 w-3.5" />
                          <span>Assign Batch</span>
                        </span>
                      ) : (
                        'Change Batch'
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(enrollment._id)}
                      className="text-error hover:bg-error/10 p-2"
                      title="Revoke / Delete Enrollment"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadEnrollments(page)}
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Revoke Enrollment"
        message="Are you sure you want to revoke this student enrollment? This will remove the student from the class roster."
        confirmLabel="Revoke"
        variant="danger"
      />

      {/* Batch Assignment / Reassignment Modal */}
      {assigningEnrollment && (
        <Modal
          open={Boolean(assigningEnrollment)}
          onClose={() => setAssigningEnrollment(null)}
          title="Assign Class Batch"
        >
          <form onSubmit={handleAssignBatchSubmit} className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-3.5 space-y-1 text-xs">
              <p className="text-text-muted">
                Student: <span className="font-bold text-text">{assigningEnrollment.studentId?.fullName}</span> ({assigningEnrollment.studentId?.email})
              </p>
              <p className="text-text-muted">
                Course: <span className="font-bold text-primary">{assigningEnrollment.courseId?.title}</span>
              </p>
              <p className="text-text-muted">
                Current Batch:{' '}
                <span className="font-bold text-text">
                  {assigningEnrollment.classId?.batchName || 'None (Pending)'}
                </span>
              </p>
            </div>

            {loadingClasses ? (
              <div className="py-6 text-center text-xs text-text-muted">Loading available batches...</div>
            ) : availableClasses.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-2">
                <p className="text-xs font-bold text-amber-700">No active class batches exist for this course yet.</p>
                <p className="text-[11px] text-text-muted">
                  Please go to the Classes tab to create a new batch for this course first.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-text">
                  Select Target Class Batch:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableClasses.map((clsItem) => {
                    const isSelected = selectedClassId === clsItem._id
                    const isFull = Boolean(clsItem.capacity && (clsItem.currentStudents || 0) >= clsItem.capacity)

                    return (
                      <div
                        key={clsItem._id}
                        onClick={() => !isFull && setSelectedClassId(clsItem._id)}
                        className={`rounded-xl border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : isFull
                            ? 'border-border bg-background opacity-60 cursor-not-allowed'
                            : 'border-border bg-surface hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text">{clsItem.batchName}</span>
                          <span className="text-[11px] text-text-muted">
                            {clsItem.currentStudents || 0} / {clsItem.capacity || '∞'} Enrolled
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted">
                          <span>Instructor: {clsItem.teacherId?.fullName || 'Assigned'}</span>
                          <span>Days: {clsItem.classDays?.join(', ') || 'TBD'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAssigningEnrollment(null)}
                disabled={assigningLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={assigningLoading || availableClasses.length === 0 || !selectedClassId}
              >
                {assigningLoading ? 'Saving...' : 'Confirm Batch Assignment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Container>
  )
}
