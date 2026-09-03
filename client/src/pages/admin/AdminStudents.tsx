import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, EmptyState, Container, Pagination } from '@/components'
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

  if (loading && students.length === 0) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="70px" />
          ))}
        </div>
      </Container>
    )
  }

  if (error && students.length === 0) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Registered Students</h1>
          <p className="mt-1 text-sm text-text-muted">Manage and view all registered students on EduFlow.</p>
        </div>
        <ErrorState title="Unable to load students" message={error} onRetry={() => loadStudents(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            Directory of all registered student accounts, course enrollments, and status.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
        </select>
        <Button variant="primary" onClick={handleSearch} size="sm">
          Search
        </Button>
      </div>

      {/* Students Table */}
      {students.length === 0 ? (
        <EmptyState
          title="No registered students found"
          description="There are no students matching your search criteria."
          icon={<UsersIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Student</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Contact</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Enrolled Courses</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Registered Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => {
                  const status = mapStatusBadge(student.status)

                  return (
                    <tr key={student._id} className="hover:bg-background transition-colors duration-150">
                      {/* Name & Avatar */}
                      <td className="px-4 py-3">
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
                          <div>
                            <span className="font-semibold text-text block leading-tight">{student.fullName || 'Unnamed'}</span>
                            <span className="text-[11px] text-text-muted capitalize">{student.gender || 'student'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p className="font-medium text-text">{student.email}</p>
                          <p className="text-text-muted">{student.phone || 'No phone'}</p>
                        </div>
                      </td>

                      {/* Enrolled Courses Count */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-hover border border-border px-2.5 py-0.5 text-xs font-medium text-text">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                          {student.enrollmentCount ?? 0} {(student.enrollmentCount === 1 ? 'course' : 'courses')}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-3">
                        <Badge variant={status.variant} className="capitalize">
                          {status.label}
                        </Badge>
                      </td>

                      {/* Registered Date */}
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {formatDate(student.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={student.status === 'active' ? 'outline' : 'primary'}
                          size="sm"
                          disabled={updatingId === student._id}
                          onClick={() => handleToggleStatus(student)}
                          className="text-xs py-1 px-2.5"
                        >
                          {student.status === 'active' ? 'Block' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
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
    </Container>
  )
}

