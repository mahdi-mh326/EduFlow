import { Modal } from '@/components'
import { Button, Badge } from '@/components'
import { BookOpenIcon } from '@/components/ui/icons'
import type { Enrollment } from '@/types/enrollment'
import { formatCurrency, formatDate } from '@/utils'

interface PaymentSummaryProps {
  open: boolean
  onClose: () => void
  enrollment: Enrollment
  onConfirm: () => void
  loading?: boolean
}

export function PaymentSummary({ open, onClose, enrollment, onConfirm, loading }: PaymentSummaryProps) {
  const course = enrollment.courseId
  const cls = enrollment.classId
  const teacher = cls?.teacherId
  const price = course?.price ?? 0
  const offerPrice = (course as any)?.offerPrice as number | undefined

  return (
    <Modal open={open} onClose={onClose} title="Payment Summary" size="md">
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpenIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">{course?.title || 'Course'}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                {cls?.batchName || 'Batch'} • {teacher?.fullName || 'Instructor'}
              </p>

            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <h4 className="text-xs font-medium text-text-muted mb-3">Order Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Course Fee</span>
              <span className="font-medium text-text">{formatCurrency(price)}</span>
            </div>
            {offerPrice !== undefined && offerPrice < price && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Offer Discount</span>
                <span className="font-medium text-primary">-{formatCurrency(price - offerPrice)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="font-semibold text-text">Amount Payable</span>
              <span className="text-lg font-bold text-text">{formatCurrency(offerPrice ?? price)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <h4 className="text-xs font-medium text-text-muted mb-3">Enrollment Details</h4>
          <div className="space-y-2 text-xs text-text-muted">
            <div className="flex items-center justify-between">
              <span>Enrollment Date</span>
              <span className="font-medium text-text">{formatDate(enrollment.enrolledAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Enrollment Status</span>
              <Badge variant={enrollment.status === 'active' ? 'success' : 'warning'}>
                {enrollment.status === 'active' ? 'Active' : enrollment.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment Status</span>
              <Badge variant="warning">Pending</Badge>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="text-xs text-text-muted">
            You will be redirected to our secure payment gateway to complete the payment.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm} loading={loading} className="w-full sm:w-auto">
            Pay Now
          </Button>
        </div>
      </div>
    </Modal>
  )
}
