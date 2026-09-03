import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, EmptyState, Container, Pagination, Modal, ConfirmDialog } from '@/components'
import { adminApi } from '@/services/api/admin'
import { UsersIcon } from '@/components/ui/icons'
import type { AdminStudent } from '@/types/admin'
import { getAvatarUrl } from '@/utils'

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'success' as const }
    case 'blocked':
      return { label: 'Blocked', variant: 'error' as const }
    case 'pending':
      return { label: 'Pending', variant: 'warning' as const }
    default:
      return { label: status, variant: 'default' as const }
  }
}

export function AdminStudents() {
  const [students, setStudents] = useState<AdminStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Warning Modal States
  const [warnModalStudent, setWarnModalStudent] = useState<AdminStudent | null>(null)
  const [warnTitle, setWarnTitle] = useState('Administrative Warning Notice')
  const [warnMessage, setWarnMessage] = useState('')
  const [warnSending, setWarnSending] = useState(false)

  // Delete Confirm Dialog States
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<AdminStudent | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Student Details Modal States
  const [detailsStudent, setDetailsStudent] = useState<AdminStudent | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsData, setDetailsData] = useState<(AdminStudent & { enrollments: any[]; totalEnrollments: number }) | null>(null)

  const loadStudents = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getStudents({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      })

      setStudents(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load students. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents(currentPage)
  }, [currentPage, statusFilter])

  const handleSearch = () => {
    setCurrentPage(1)
    loadStudents(1)
  }

  const handleToggleStatus = async (student: AdminStudent) => {
    const newStatus = student.status === 'active' ? 'blocked' : 'active'
    setUpdatingId(student._id)
    try {
      await adminApi.updateStudentStatus(student._id, newStatus)
      toast.success(`Student marked as ${newStatus}`)
      setStudents((prev) =>
        prev.map((s) => (s._id === student._id ? { ...s, status: newStatus } : s))
      )
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update student status')
    } finally {
      setUpdatingId(null)
    }
  }

  // Open Warning Modal
  const handleOpenWarning = (student: AdminStudent) => {
    setWarnModalStudent(student)
    setWarnTitle('Administrative Warning Notice')
    setWarnMessage('')
  }

  // Send Warning
  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!warnModalStudent) return
    if (!warnMessage.trim()) {
      toast.error('Please enter a warning message.')
      return
    }

    setWarnSending(true)
    try {
      await adminApi.warnStudent(warnModalStudent._id, {
        title: warnTitle.trim(),
        message: warnMessage.trim(),
      })
      toast.success(`Warning notice sent to ${warnModalStudent.fullName}`)
      setWarnModalStudent(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send warning')
    } finally {
      setWarnSending(false)
    }
  }

  // Open Details Modal
  const handleOpenDetails = async (student: AdminStudent) => {
    setDetailsStudent(student)
    setLoadingDetails(true)
    setDetailsData(null)
    try {
      const res = await adminApi.getStudentById(student._id)
      setDetailsData(res.data)
    } catch {
      toast.error('Could not fetch complete student details')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmStudent) return
    setDeleteLoading(true)
    try {
      await adminApi.deleteStudent(deleteConfirmStudent._id)
      toast.success('Student account deleted successfully')
      setStudents((prev) => prev.filter((s) => s._id !== deleteConfirmStudent._id))
      setMeta((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null))
      setDeleteConfirmStudent(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete student')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading && students.length === 0) {
    return (
      <Container className="py-6 sm:py-8 max-w-7xl">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="80px" className="rounded-xl" />
          ))}
        </div>
      </Container>
    )
  }

  if (error && students.length === 0) {
    return (
      <Container className="py-6 sm:py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Registered Students</h1>
          <p className="mt-1 text-sm text-text-muted">Manage and view all registered students on EduFlow.</p>
        </div>
        <ErrorState title="Unable to load students" message={error} onRetry={() => loadStudents(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-6 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text sm:text-3xl">Registered Students</h1>
            {meta && (
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                {meta.total} total
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Directory of student accounts with administrative controls (Block, Warning, Delete, Details).
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none shadow-xs"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
          </select>
          <Button variant="primary" onClick={handleSearch} size="sm" className="shrink-0">
            Search
          </Button>
        </div>
      </div>

      {/* Students Listing */}
      {students.length === 0 ? (
        <EmptyState
          title="No registered students found"
          description="There are no students matching your search criteria."
          icon={<UsersIcon className="h-12 w-12" />}
        />
      ) : (
        <>
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-text-muted">Student</th>
                    <th className="px-4 py-3 text-xs font-medium text-text-muted">Contact Info</th>
                    <th className="px-4 py-3 text-xs font-medium text-text-muted">Enrolled Courses</th>
                    <th className="px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-text-muted">Joined On</th>
                    <th className="px-4 py-3 text-xs font-medium text-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => {
                    const status = mapStatusBadge(student.status)

                    return (
                      <tr key={student._id} className="hover:bg-background/80 transition-colors duration-150">
                        {/* Name & Avatar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">
                              {student.avatar ? (
                                <img
                                  src={getAvatarUrl(student.avatar)}
                                  alt={student.fullName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                student.fullName?.charAt(0).toUpperCase() || 'S'
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-text block leading-tight truncate">{student.fullName || 'Unnamed'}</span>
                              <span className="text-[11px] text-text-muted capitalize">{student.gender || 'Student'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs space-y-0.5">
                            <p className="font-medium text-text truncate">{student.email}</p>
                            <p className="text-text-muted">{student.phone || 'No phone'}</p>
                          </div>
                        </td>

                        {/* Enrolled Courses Count */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-2.5 py-0.5 text-xs font-medium text-text">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                            {student.enrollmentCount ?? 0} {student.enrollmentCount === 1 ? 'course' : 'courses'}
                          </span>
                        </td>

                        {/* Account Status */}
                        <td className="px-4 py-3.5">
                          <Badge variant={status.variant} className="capitalize text-[11px]">
                            {status.label}
                          </Badge>
                        </td>

                        {/* Registered Date */}
                        <td className="px-4 py-3.5 text-text-muted text-xs whitespace-nowrap">
                          {formatDate(student.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(student)}
                              title="View Student Details"
                              className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Warning */}
                            <button
                              type="button"
                              onClick={() => handleOpenWarning(student)}
                              title="Send Warning Notice"
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-500/10 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </button>

                            {/* Block / Unblock */}
                            <button
                              type="button"
                              disabled={updatingId === student._id}
                              onClick={() => handleToggleStatus(student)}
                              title={student.status === 'active' ? 'Block Student' : 'Activate Student'}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                                student.status === 'active'
                                  ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                              }`}
                            >
                              {student.status === 'active' ? 'Block' : 'Unblock'}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmStudent(student)}
                              title="Delete Student Account"
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {students.map((student) => {
              const status = mapStatusBadge(student.status)

              return (
                <div
                  key={student._id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-xs space-y-3"
                >
                  {/* Top: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">
                        {student.avatar ? (
                          <img
                            src={getAvatarUrl(student.avatar)}
                            alt={student.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          student.fullName?.charAt(0).toUpperCase() || 'S'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text truncate">{student.fullName || 'Unnamed'}</p>
                        <p className="text-xs text-text-muted truncate">{student.email}</p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="capitalize text-[11px] shrink-0">
                      {status.label}
                    </Badge>
                  </div>

                  {/* Middle Info Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-border py-2 text-text-muted">
                    <div>
                      <span className="text-[11px] text-text-muted block">Phone:</span>
                      <span className="font-medium text-text">{student.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted block">Joined:</span>
                      <span className="font-medium text-text">{formatDate(student.createdAt)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] text-text-muted block mb-0.5">Enrollments:</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-2.5 py-0.5 text-xs font-medium text-text">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                        {student.enrollmentCount ?? 0} {student.enrollmentCount === 1 ? 'course enrolled' : 'courses enrolled'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(student)}
                        className="text-xs py-1 px-2.5"
                      >
                        Details
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleOpenWarning(student)}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                      >
                        <span>⚠️</span> Warn
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={updatingId === student._id}
                        onClick={() => handleToggleStatus(student)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          student.status === 'active'
                            ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                        }`}
                      >
                        {student.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmStudent(student)}
                        title="Delete Student"
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/10 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadStudents(page)}
          />
        </div>
      )}

      {/* Warning Modal */}
      <Modal
        open={Boolean(warnModalStudent)}
        onClose={() => setWarnModalStudent(null)}
        title="Send Administrative Warning"
        size="md"
      >
        {warnModalStudent && (
          <form onSubmit={handleSendWarning} className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <p className="font-semibold text-amber-800">Direct Official Warning</p>
                <p className="mt-0.5 text-amber-700">
                  This warning will be sent directly to <strong>{warnModalStudent.fullName}</strong> ({warnModalStudent.email}) as an in-app notification and email alert.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">
                Warning Subject / Reason
              </label>
              <input
                type="text"
                value={warnTitle}
                onChange={(e) => setWarnTitle(e.target.value)}
                placeholder="e.g. Code of Conduct Violation, Attendance Shortage"
                required
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">
                Detailed Warning Notice
              </label>
              <textarea
                rows={4}
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                placeholder="Specify the reason for the warning, violation details, or required corrective action..."
                required
                className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWarnModalStudent(null)}
                disabled={warnSending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={warnSending || !warnMessage.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {warnSending ? 'Sending...' : 'Send Warning'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteConfirmStudent)}
        onClose={() => setDeleteConfirmStudent(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Account"
        message={`Are you sure you want to permanently delete ${deleteConfirmStudent?.fullName || 'this student'}'s account? They will lose access to their enrolled courses and portal.`}
        confirmLabel="Delete Student"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Student Details Modal */}
      <Modal
        open={Boolean(detailsStudent)}
        onClose={() => setDetailsStudent(null)}
        title="Student Profile & Enrollments"
        size="lg"
      >
        {detailsStudent && (
          <div className="space-y-5">
            {/* Student Header */}
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-lg font-bold text-primary ring-2 ring-border">
                {detailsStudent.avatar ? (
                  <img
                    src={getAvatarUrl(detailsStudent.avatar)}
                    alt={detailsStudent.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  detailsStudent.fullName?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text truncate">{detailsStudent.fullName}</h3>
                <p className="text-xs text-text-muted">{detailsStudent.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant={mapStatusBadge(detailsStudent.status).variant} className="capitalize text-[10px]">
                    {detailsStudent.status}
                  </Badge>
                  <span className="text-[11px] text-text-muted">
                    Joined: {formatDate(detailsStudent.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-background p-3.5 rounded-xl border border-border">
              <div>
                <span className="text-text-muted block">Phone Number</span>
                <span className="font-semibold text-text">{detailsStudent.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-text-muted block">Gender</span>
                <span className="font-semibold text-text capitalize">{detailsStudent.gender || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-text-muted block">Email Verified</span>
                <span className="font-semibold text-text">{detailsStudent.isVerified ? '✅ Verified' : '⚠️ Pending'}</span>
              </div>
            </div>

            {/* Course Enrollments */}
            <div>
              <h4 className="text-sm font-bold text-text mb-2.5">
                Enrolled Courses ({loadingDetails ? '...' : detailsData?.totalEnrollments ?? 0})
              </h4>

              {loadingDetails ? (
                <div className="space-y-2">
                  <Skeleton variant="rect" height="48px" className="rounded-lg" />
                  <Skeleton variant="rect" height="48px" className="rounded-lg" />
                </div>
              ) : !detailsData?.enrollments || detailsData.enrollments.length === 0 ? (
                <div className="rounded-xl border border-border bg-background p-6 text-center text-xs text-text-muted">
                  This student has not enrolled in any courses yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {detailsData.enrollments.map((enr: any) => (
                    <div
                      key={enr._id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text truncate">{enr.courseId?.title || 'Course'}</p>
                        <p className="text-text-muted truncate">
                          {enr.classId?.batchName ? `Batch: ${enr.classId.batchName}` : 'Class Enrollment'} • Enrolled: {formatDate(enr.enrolledAt)}
                        </p>
                      </div>
                      <Badge variant={enr.status === 'active' ? 'success' : 'default'} className="capitalize shrink-0">
                        {enr.status || 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setDetailsStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Container>
  )
}


