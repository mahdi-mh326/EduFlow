import { useState, useEffect } from 'react'
import { Badge, Skeleton, ErrorState, EmptyState, Container, Select, Pagination } from '@/components'
import { adminApi } from '@/services/api/admin'
import {
  InboxIcon,
} from '@/components/ui/icons'

const PAYMENT_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const loadPayments = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getPayments({
        page,
        limit: 10,
        status: statusFilter || undefined,
        sortBy: 'newest',
        sortOrder: 'desc',
      })
      setPayments(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load payments. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments(1)
  }, [statusFilter])

  if (loading && payments.length === 0) {
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

  if (error && payments.length === 0) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all payment records.</p>
        </div>
        <ErrorState title="Unable to load payments" message={error} onRetry={() => loadPayments(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Payments</h1>
        <p className="mt-1 text-sm text-text-muted">Manage all payment records.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={PAYMENT_STATUSES} className="sm:w-40" />
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description={statusFilter ? 'Try adjusting your filters.' : 'Payment records will appear here.'}
          icon={<InboxIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className="rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-text truncate">{payment.studentId?.fullName || 'Student'}</p>
                    <Badge variant={payment.status === 'paid' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'} className="capitalize">{payment.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-text-muted truncate">{payment.courseId?.title || 'Course'} • {payment.classId?.batchName || 'Class'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span>৳{payment.amount}</span>
                    <span>{payment.currency}</span>
                    <span>{payment.gateway}</span>
                    <span className="break-all">{payment.transactionId}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text">৳{payment.amount}</p>
                  <p className="text-xs text-text-muted">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(page) => loadPayments(page)} />
        </div>
      )}
    </Container>
  )
}
