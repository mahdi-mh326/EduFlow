import { useState, useEffect } from 'react'
import { Badge, Skeleton, ErrorState, EmptyState, Container } from '@/components'
import { paymentApi } from '@/services/api/payment'
import { InboxIcon } from '@/components/ui/icons'
import type { Payment } from '@/services/api/payment'

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' | 'default' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'error'
    case 'cancelled':
      return 'neutral'
    default:
      return 'default'
  }
}

export function StudentPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await paymentApi.getStudentPayments()
      setPayments(data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load payment history.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="120px" className="mb-3" />
              <Skeleton variant="text" height="2rem" width="80px" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="70px" />
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Payment History</h1>
          <p className="mt-1 text-sm text-text-muted">View your payment records and transaction history.</p>
        </div>
        <ErrorState title="Unable to load payments" message={error} onRetry={loadPayments} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Payment History</h1>
        <p className="mt-1 text-sm text-text-muted">View your payment records and transaction history.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Total Payments</p>
          <p className="text-2xl font-bold text-text mt-1">{payments.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Total Paid</p>
          <p className="text-2xl font-bold text-success mt-1">৳{totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Pending</p>
          <p className="text-2xl font-bold text-warning mt-1">৳{totalPending.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Transactions</p>
          <p className="text-2xl font-bold text-text mt-1">{payments.length}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Your payment history will appear here once you make a payment."
          icon={<InboxIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Transaction ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Course</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Class</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Gateway</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-background transition-colors duration-150">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-text">{payment.transactionId}</span>
                    </td>
                    <td className="px-4 py-3 text-text">{payment.courseId?.title || 'N/A'}</td>
                    <td className="px-4 py-3 text-text-muted">{payment.classId?.batchName || 'N/A'}</td>
                    <td className="px-4 py-3 font-medium text-text">৳{payment.amount}</td>
                    <td className="px-4 py-3 text-text-muted">{payment.gateway}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(payment.status)} className="capitalize">
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(payment.paidAt || payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  )
}
