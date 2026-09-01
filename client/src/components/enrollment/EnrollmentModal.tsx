import { useState, useEffect, type FormEvent } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Badge } from '@/components'
import { enrollmentApi } from '@/services/api/enrollment'
import { paymentApi } from '@/services/api/payment'
import { BookOpenIcon, CheckCircleIcon } from '@/components/ui/icons'

import type { ClassResponse } from '@/services/api/course'
import { formatCurrency } from '@/utils'

interface EnrollmentModalProps {
  open: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  coursePrice: number
  classes: ClassResponse[]
  onSuccess: (enrollmentId: string) => void
}

function formatTime(time: string) {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function EnrollmentModal({
  open,
  onClose,
  courseId,
  courseTitle,
  coursePrice,
  classes,
  onSuccess,
}: EnrollmentModalProps) {
  const navigate = useNavigate()
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [step, setStep] = useState<'confirm' | 'submitting' | 'success' | 'error'>('confirm')
  const [errorMessage, setErrorMessage] = useState('')
  const [enrollmentResult, setEnrollmentResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPaidCourse = typeof coursePrice === 'number' && coursePrice > 0

  const activeClasses = classes.filter(
    (cls) => cls.status === 'upcoming' || cls.status === 'ongoing'
  )

  useEffect(() => {
    if (open) {
      setStep('confirm')
      setErrorMessage('')
      setEnrollmentResult(null)
      setIsSubmitting(false)
      if (activeClasses.length > 0) {
        setSelectedClassId(activeClasses[0]._id)
      } else if (classes.length > 0) {
        setSelectedClassId(classes[0]._id)
      }
    }
  }, [open, classes])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const targetClassId = selectedClassId || (classes[0] ? classes[0]._id : undefined)

    setIsSubmitting(true)

    try {
      if (isPaidCourse) {
        setStep('submitting')
        toast.loading('Connecting to secure payment gateway...', { id: 'payment-init' })

        const paymentRes = await paymentApi.initiatePayment({
          courseId,
          ...(targetClassId ? { classId: targetClassId } : {}),
        })

        toast.dismiss('payment-init')

        if (paymentRes.gatewayUrl) {
          toast.success('Redirecting to payment...')
          window.location.href = paymentRes.gatewayUrl
          return
        } else {
          throw new Error('Payment gateway URL not received.')
        }
      } else {
        // Free course direct enrollment
        setStep('submitting')
        const result = await enrollmentApi.createEnrollment({
          courseId,
          ...(targetClassId ? { classId: targetClassId } : {}),
        })

        setEnrollmentResult(result)
        setStep('success')
        setIsSubmitting(false)

        onSuccess(result._id)
        toast.success('Enrollment successful!')
      }
    } catch (error: any) {
      toast.dismiss('payment-init')
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to process enrollment. Please try again.'
      setErrorMessage(message)
      setStep('error')
      setIsSubmitting(false)
      toast.error(message)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const selectedClass = classes.find((c) => c._id === selectedClassId) || classes[0]

  return (
    <Modal open={open} onClose={handleClose} title={isPaidCourse ? 'Course Checkout & Enrollment' : 'Enroll in Course'} size="lg">
      {step === 'confirm' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Summary */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BookOpenIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text">{courseTitle}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Course Fee:{' '}
                  <span className="font-bold text-text text-sm">
                    {isPaidCourse ? formatCurrency(coursePrice) : 'Free'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Class Batch Selection */}
          {classes.length === 0 ? (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-center">
              <p className="text-sm font-medium text-text">No active class batch available</p>
              <p className="mt-1 text-xs text-text-muted">
                Admin is setting up upcoming batches for this course. Please check back shortly.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold text-text">Select Class Batch & Schedule</h3>
              <p className="mt-0.5 text-xs text-text-muted">
                Choose your preferred schedule and instructor.
              </p>
              <div className="mt-3 space-y-2">
                {classes.map((cls) => {
                  const isSelected = cls._id === selectedClassId
                  return (
                    <div
                      key={cls._id}
                      onClick={() => setSelectedClassId(cls._id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                          : 'border-border bg-surface hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="classSelection"
                            checked={isSelected}
                            onChange={() => setSelectedClassId(cls._id)}
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                          <p className="text-sm font-bold text-text">{cls.batchName}</p>
                        </div>
                        <Badge variant={cls.status === 'ongoing' ? 'success' : 'primary'} className="capitalize text-xs">
                          {cls.status}
                        </Badge>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-text-muted">
                        <div>
                          <p className="font-medium text-text">Instructor</p>
                          <p className="text-primary font-semibold">{cls.teacherId?.fullName || 'TBD'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-text">Class Timing</p>
                          <p>{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-text">Class Days</p>
                          <p>{cls.classDays?.join(', ') || 'TBD'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-text">Duration</p>
                          <p>{formatDate(cls.startDate)} – {formatDate(cls.endDate)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Payment Breakdown / Gateway Info */}
          {isPaidCourse ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted font-medium">Total Payable</p>
                  <p className="text-xl font-extrabold text-primary">{formatCurrency(coursePrice)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  SSL Secured
                </div>
              </div>

              <div className="pt-2 border-t border-primary/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted">
                <span>Accepted Payment Methods:</span>
                <span className="font-semibold text-text">bKash • Nagad • Rocket • Cards • Net Banking</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Course Fee</p>
                <p className="text-lg font-bold text-emerald-600">100% Free</p>
              </div>
              <Badge variant="success">Free Enrollment</Badge>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-error/20 bg-error/5 p-3">
              <p className="text-sm text-error">{errorMessage}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full sm:w-auto gap-1.5 shadow-sm"
            >

              {isSubmitting ? (
                'Processing...'
              ) : isPaidCourse ? (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Proceed to Payment ({formatCurrency(coursePrice)})
                </>
              ) : (
                'Confirm Free Enrollment'
              )}
            </Button>
          </div>

        </form>
      )}

      {step === 'submitting' && (
        <div className="py-12 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <div>
            <h3 className="text-base font-bold text-text">Connecting to Payment Gateway...</h3>
            <p className="text-xs text-text-muted mt-1">Please wait while we redirect you to secure checkout.</p>
          </div>
        </div>
      )}

      {step === 'success' && enrollmentResult && (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircleIcon className="h-10 w-10" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-text">Enrollment Successful!</h3>
            <p className="mt-1 text-sm text-text-muted">
              You are now enrolled in <span className="font-semibold text-text">{courseTitle}</span>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Course</span>
                <span className="font-medium text-text">{courseTitle}</span>
              </div>
              {selectedClass && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Batch</span>
                  <span className="font-medium text-text">{selectedClass.batchName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Status</span>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Back to Course
            </Button>
            <Button variant="primary" onClick={() => navigate('/student/enrollments')}>
              Go to My Enrollments
            </Button>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
            <span className="text-3xl">⚠️</span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-text">Enrollment Failed</h3>
            <p className="mt-1 text-sm text-text-muted">{errorMessage}</p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setStep('confirm')}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
