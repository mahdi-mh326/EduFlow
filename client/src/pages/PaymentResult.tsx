import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Badge, Container } from '@/components'
import { paymentApi } from '@/services/api/payment'
import { CheckCircleIcon, AlertCircleIcon, ClockIcon } from '@/components/ui/icons'
import type { Payment } from '@/types/enrollment'
import { formatCurrency, formatDate } from '@/utils'

type PaymentResultStatus = 'loading' | 'success' | 'failed' | 'cancelled' | 'pending' | 'error'

function mapStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', variant: 'success' as const }
    case 'pending':
      return { label: 'Pending', variant: 'warning' as const }
    case 'failed':
      return { label: 'Failed', variant: 'error' as const }
    case 'cancelled':
      return { label: 'Cancelled', variant: 'error' as const }
    case 'refunded':
      return { label: 'Refunded', variant: 'default' as const }
    default:
      return { label: status, variant: 'default' as const }
  }
}

export function PaymentResult() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<PaymentResultStatus>('loading')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const tranId = searchParams.get('tran_id')
  const queryStatus = searchParams.get('status')
  const queryMessage = searchParams.get('message')

  useEffect(() => {
    if (queryStatus === 'failed') {
      setStatus('failed')
      if (queryMessage) setErrorMessage(queryMessage)
      return
    }

    if (queryStatus === 'cancelled') {
      setStatus('cancelled')
      return
    }

    if (!tranId) {
      if (queryStatus === 'success') {
        setStatus('success')
        return
      }
      setStatus('error')
      setErrorMessage('Missing transaction ID.')
      return
    }

    const verifyPayment = async () => {
      try {
        let found: Payment | undefined
        try {
          found = await paymentApi.getPaymentByTranId(tranId)
        } catch {
          const payments = await paymentApi.getStudentPayments()
          found = payments.find((p) => p.transactionId === tranId)
        }

        if (found) {
          setPayment(found)
          const mappedStatus =
            found.status === 'paid' ? 'success' : (found.status as PaymentResultStatus)
          setStatus(mappedStatus)
        } else if (queryStatus === 'success') {
          setStatus('success')
        } else {
          setStatus('pending')
          setErrorMessage('Payment record not found yet. It may still be processing.')
        }
      } catch (err: any) {
        if (queryStatus === 'success') {
          setStatus('success')
        } else {
          setStatus('error')
          setErrorMessage(err?.response?.data?.message || 'Unable to verify payment status.')
        }
      }
    }

    verifyPayment()
  }, [tranId, queryStatus, queryMessage])


  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-16 w-16 text-success" />
      case 'failed':
      case 'cancelled':
        return <AlertCircleIcon className="h-16 w-16 text-error" />
      case 'pending':
        return <ClockIcon className="h-16 w-16 text-accent" />
      default:
        return <ClockIcon className="h-16 w-16 text-gray-300" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'success':
        return 'Payment Successful'
      case 'failed':
        return 'Payment Failed'
      case 'cancelled':
        return 'Payment Cancelled'
      case 'pending':
        return 'Payment Pending'
      case 'error':
        return 'Verification Error'
      default:
        return 'Processing Payment'
    }
  }

  const getDescription = () => {
    switch (status) {
      case 'success':
        return 'Your payment has been verified and completed successfully.'
      case 'failed':
        return 'Your payment could not be processed. Please try again.'
      case 'cancelled':
        return 'You cancelled the payment. You can try again anytime.'
      case 'pending':
        return errorMessage || 'Your payment is being processed. Please check back later.'
      case 'error':
        return errorMessage || 'Unable to verify payment status.'
      default:
        return 'Please wait while we verify your payment.'
    }
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          {getIcon()}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-text sm:text-3xl">{getTitle()}</h1>
        <p className="mt-2 text-sm text-text-muted">{getDescription()}</p>

        {payment && (
          <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-left">
            <h3 className="text-sm font-semibold text-text mb-4">Payment Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Course</span>
                <span className="font-medium text-text">{payment.courseId?.title || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Transaction ID</span>
                <span className="font-medium text-text">{payment.transactionId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Amount</span>
                <span className="font-medium text-text">
                  {formatCurrency(payment.amount, payment.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Status</span>
                <Badge variant={mapStatusBadge(payment.status).variant}>
                  {mapStatusBadge(payment.status).label}
                </Badge>
              </div>
              {payment.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Paid At</span>
                  <span className="font-medium text-text">{formatDate(payment.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/student/enrollments">
            <Button variant="primary">Go to My Enrollments</Button>
          </Link>
          <Link to="/courses">
            <Button variant="ghost">Browse Courses</Button>
          </Link>
        </div>
      </div>
    </Container>
  )
}
