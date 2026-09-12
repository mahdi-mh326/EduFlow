import { useState, useEffect } from 'react'
import { Badge, Skeleton, ErrorState, EmptyState, Container, Select, Pagination, Button } from '@/components'
import { Modal } from '@/components/ui/Modal'
import { adminApi } from '@/services/api/admin'
import {
  InboxIcon,
  SearchIcon,
  DownloadIcon,
  CheckCircleIcon,
  EyeIcon,
  TrendingUpIcon,
  ClockIcon,
  AlertTriangleIcon,
} from '@/components/ui/icons'
import { toast } from 'react-hot-toast'

const PAYMENT_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number; summary?: any } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadPayments = async (page: number, searchVal = search, statusVal = statusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getPayments({
        page,
        limit: 10,
        search: searchVal.trim() || undefined,
        status: statusVal || undefined,
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
    loadPayments(1, search, statusFilter)
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadPayments(1, search, statusFilter)
  }

  const handleMarkPaid = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to mark this payment as Paid? This will automatically enroll the student in the course.')) {
      return
    }
    setUpdatingId(paymentId)
    try {
      await adminApi.updatePaymentStatus(paymentId, 'paid')
      toast.success('Payment marked as paid & student enrolled!')
      if (selectedPayment && selectedPayment._id === paymentId) {
        setSelectedPayment({ ...selectedPayment, status: 'paid', paidAt: new Date().toISOString() })
      }
      loadPayments(currentPage, search, statusFilter)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update payment status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.error('No payments available to export')
      return
    }

    const headers = ['Transaction ID', 'Student Name', 'Student Email', 'Course', 'Batch', 'Amount (BDT)', 'Gateway', 'Status', 'Date']
    const rows = payments.map((p) => [
      p.transactionId || '',
      `"${(p.studentId?.fullName || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.studentId?.email || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.courseId?.title || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.classId?.batchName || 'N/A').replace(/"/g, '""')}"`,
      p.amount || 0,
      p.gateway || 'SSLCommerz',
      p.status || '',
      p.paidAt ? new Date(p.paidAt).toLocaleDateString() : p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `EduFlow_Payments_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Payments downloaded as CSV')
  }

  const summary = meta?.summary || {
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
  }

  if (loading && payments.length === 0) {
    return (
      <Container className="py-8 space-y-6">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="90px" className="rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="80px" className="rounded-xl" />
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
          <p className="mt-1 text-sm text-text-muted">Manage all payment records & financials.</p>
        </div>
        <ErrorState title="Unable to load payments" message={error} onRetry={() => loadPayments(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Payment Management</h1>
          <p className="mt-1 text-sm text-text-muted">
            Track student course payments, review revenue, and verify offline or pending transactions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 font-medium"
        >
          <DownloadIcon className="h-4 w-4 text-primary" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Revenue</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">৳{summary.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
            <TrendingUpIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Successful Paid</p>
            <p className="mt-1 text-2xl font-black text-text">{summary.paidCount}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pending Verification</p>
            <p className="mt-1 text-2xl font-black text-amber-600">{summary.pendingCount}</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
            <ClockIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Failed / Cancelled</p>
            <p className="mt-1 text-2xl font-black text-rose-600">{summary.failedCount}</p>
          </div>
          <div className="rounded-xl bg-rose-500/10 p-3 text-rose-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, or transaction ID..."
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={PAYMENT_STATUSES}
            className="w-full sm:w-44"
          />
          <Button type="submit" variant="primary" size="sm" className="whitespace-nowrap">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                loadPayments(1, '', statusFilter)
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description={statusFilter || search ? 'Try adjusting your search criteria.' : 'Payment records will appear here.'}
          icon={<InboxIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className="rounded-2xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-base text-text">{payment.studentId?.fullName || 'Student'}</span>
                    <Badge
                      variant={payment.status === 'paid' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'}
                      className="capitalize text-[11px] font-bold"
                    >
                      {payment.status}
                    </Badge>
                    <span className="rounded-md bg-surface-muted px-2 py-0.5 font-mono text-xs text-text-muted border border-border">
                      {payment.transactionId}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span className="text-text font-medium">{payment.studentId?.email}</span>
                    <span>•</span>
                    <span className="text-primary font-medium">{payment.courseId?.title || 'Course'}</span>
                    {payment.classId?.batchName && (
                      <>
                        <span>•</span>
                        <span>{payment.classId.batchName}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                    <span>Gateway: <strong>{payment.gateway || 'SSLCommerz'}</strong></span>
                    <span>•</span>
                    <span>Date: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : new Date(payment.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:flex-col md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-6">
                  <div className="text-left md:text-right">
                    <p className="text-lg font-black text-text">৳{payment.amount}</p>
                    <p className="text-[11px] text-text-muted">{payment.currency || 'BDT'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {payment.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={updatingId === payment._id}
                        onClick={() => handleMarkPaid(payment._id)}
                        className="text-xs h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-300 font-semibold inline-flex items-center gap-1"
                        title="Mark as Paid & Activate Enrollment"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        <span>Mark Paid</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPayment(payment)}
                      className="text-xs h-7 px-2 text-primary hover:bg-primary/10 inline-flex items-center gap-1"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      <span>Receipt</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => loadPayments(page, search, statusFilter)}
          />
        </div>
      )}

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <Modal
          open={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title="Payment Details & Receipt"
          size="md"
        >
          <div className="space-y-6 pt-2">
            {/* Receipt Summary Card */}
            <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Transaction ID</p>
                  <p className="text-sm font-mono font-bold text-text">{selectedPayment.transactionId}</p>
                </div>
                <Badge
                  variant={selectedPayment.status === 'paid' ? 'success' : selectedPayment.status === 'pending' ? 'warning' : 'error'}
                  className="capitalize text-xs font-bold"
                >
                  {selectedPayment.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-text-muted">Total Amount</span>
                  <p className="text-lg font-black text-emerald-600">৳{selectedPayment.amount} {selectedPayment.currency || 'BDT'}</p>
                </div>
                <div>
                  <span className="text-text-muted">Payment Gateway</span>
                  <p className="font-bold text-text">{selectedPayment.gateway || 'SSLCommerz'}</p>
                </div>
                <div>
                  <span className="text-text-muted">Created At</span>
                  <p className="font-medium text-text">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-text-muted">Paid Date</span>
                  <p className="font-medium text-text">{selectedPayment.paidAt ? new Date(selectedPayment.paidAt).toLocaleString() : 'Not paid yet'}</p>
                </div>
              </div>
            </div>

            {/* Student & Course Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <p className="font-bold text-text uppercase tracking-wider text-[11px]">Student Information</p>
                <div className="space-y-1">
                  <p className="font-semibold text-text">{selectedPayment.studentId?.fullName || 'N/A'}</p>
                  <p className="text-text-muted">{selectedPayment.studentId?.email || 'N/A'}</p>
                  {selectedPayment.studentId?.phone && (
                    <p className="text-text-muted">Phone: {selectedPayment.studentId.phone}</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <p className="font-bold text-text uppercase tracking-wider text-[11px]">Course & Class</p>
                <div className="space-y-1">
                  <p className="font-semibold text-text">{selectedPayment.courseId?.title || 'N/A'}</p>
                  <p className="text-text-muted">Batch: {selectedPayment.classId?.batchName || 'Unassigned'}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {selectedPayment.status === 'pending' ? (
                <Button
                  variant="primary"
                  size="sm"
                  loading={updatingId === selectedPayment._id}
                  onClick={() => handleMarkPaid(selectedPayment._id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Mark as Paid & Activate Enrollment</span>
                </Button>
              ) : (
                <span className="text-xs text-success font-medium inline-flex items-center gap-1">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  <span>Payment verified & enrolled</span>
                </span>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Container>
  )
}

