import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, EmptyState, Container, Pagination } from '@/components'
import { adminApi } from '@/services/api/admin'
import { UsersIcon } from '@/components/ui/icons'
import type { AdminEnrollment } from '@/types/admin'
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
    case 'cancelled':
      return { label: 'Cancelled', variant: 'error' as const }
    default:
      return { label: status, variant: 'warning' as const }
  }
}

function mapPaymentBadge(status: string) {
  switch (status) {
    case 'paid':
    case 'success':
      return { label: 'Paid', variant: 'success' as const }
    case 'pending':
      return { label: 'Pending', variant: 'warning' as const }
    case 'failed':
      return { label: 'Failed', variant: 'error' as const }
    case 'cancelled':
      return { label: 'Cancelled', variant: 'error' as const }
    default:
      return { label: status, variant: 'default' as const }
  }
}

export function AdminStudents() {
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadEnrollments = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getEnrollments({
        page,
        limit: 10,
      })
      let filtered = result.data || []

      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(
          (e) =>
            e.studentId?.fullName?.toLowerCase().includes(q) ||
            e.studentId?.email?.toLowerCase().includes(q)
        )
      }

      if (statusFilter) {
        filtered = filtered.filter((e) => e.status === statusFilter)
      }

      setEnrollments(filtered)
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
    loadEnrollments(currentPage)
  }, [currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    loadEnrollments(1)
  }

  if (loading && enrollments.length === 0) {
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

  if (error && enrollments.length === 0) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-text-muted">Manage and view all enrolled students.</p>
        </div>
        <ErrorState title="Unable to load students" message={error} onRetry={() => loadEnrollments(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-text-muted">Manage and view all enrolled students.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
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
          <option value="cancelled">Cancelled</option>
        </select>
        <Button variant="primary" onClick={handleSearch} size="sm">
          Search
        </Button>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No students found"
          description="There are no students matching your criteria."
          icon={<UsersIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Student</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Email</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Course</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Class</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Payment</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollments.map((enrollment) => {
                  const status = mapStatusBadge(enrollment.status)
                  const payment = mapPaymentBadge(enrollment.paymentStatus)

                  return (
                    <tr key={enrollment._id} className="hover:bg-background transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-xs font-semibold text-primary">
                            {enrollment.studentId?.avatar ? (
                              <img src={getAvatarUrl(enrollment.studentId.avatar)} alt={enrollment.studentId?.fullName} className="h-full w-full object-cover" />
                            ) : (
                              enrollment.studentId?.fullName?.charAt(0).toUpperCase() || 'S'
                            )}
                          </div>

                          <span className="font-medium text-text">{enrollment.studentId?.fullName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{enrollment.studentId?.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-text">{enrollment.courseId?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-text-muted">{enrollment.classId?.batchName || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={payment.variant} className="capitalize">
                          {payment.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant} className="capitalize">
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(enrollment.enrolledAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadEnrollments(page)}
          />
        </div>
      )}
    </Container>
  )
}
