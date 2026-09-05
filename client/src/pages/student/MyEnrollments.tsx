import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { PaymentSummary } from '@/components/enrollment'
import { enrollmentApi } from '@/services/api/enrollment'
import { paymentApi, redirectToPaymentGateway } from '@/services/api/payment'
import { assignmentApi } from '@/services/api/assignment'
import { quizApi } from '@/services/api/quiz'
import { savedCourseApi, type SavedCourseItem } from '@/services/api/savedCourse'
import { certificateApi } from '@/services/api/certificate'
import { CertificateModal } from '@/components/certificate/CertificateModal'
import type { Certificate } from '@/types/certificate'
import { BookOpenIcon, UsersIcon, ClockIcon, InboxIcon, FileTextIcon, ClipboardListIcon, AlertCircleIcon, BookmarkIcon, AwardIcon } from '@/components/ui/icons'
import { formatCurrency, getImageUrl } from '@/utils'
import type { Enrollment } from '@/types/enrollment'
import { toast } from 'react-hot-toast'

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isUpcoming(dateString: string) {
  if (!dateString) return false
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return false
  return date > new Date()
}

function isDeadlineNear(dateString: string, daysThreshold = 7) {
  if (!dateString) return false
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return false
  const diff = date.getTime() - Date.now()
  const days = diff / (1000 * 60 * 60 * 24)
  return days > 0 && days <= daysThreshold
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
      return { label: 'Paid', variant: 'success' as const }
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

interface ClassTask {
  type: 'assignment' | 'quiz'
  id: string
  title: string
  date: string
  status: string
  link: string
}

export function MyEnrollments() {
  const [activeTab, setActiveTab] = useState<'enrolled' | 'saved'>('enrolled')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [savedCourses, setSavedCourses] = useState<SavedCourseItem[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [tasksByEnrollment, setTasksByEnrollment] = useState<Record<string, ClassTask[]>>({})
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [activeCert, setActiveCert] = useState<Certificate | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [enrollmentData, savedData, certData] = await Promise.all([
        enrollmentApi.getEnrollments(),
        savedCourseApi.getSavedCourses().catch(() => []),
        certificateApi.getMyCertificates().catch(() => []),
      ])
      setCertificates(certData)

      setEnrollments(enrollmentData)
      setSavedCourses(savedData)

      const classIds = enrollmentData
        .map((e) => e.classId?._id)
        .filter((id): id is string => Boolean(id))

      if (classIds.length === 0) {
        setTasksByEnrollment({})
        return
      }

      const results = await Promise.allSettled([
        Promise.all(
          classIds.map((classId) =>
            assignmentApi.getAssignments({ classId, limit: 5, status: 'published', sortBy: 'dueDate', sortOrder: 'asc' }).then((res) => ({
              classId,
              assignments: res.data || [],
            }))
          )
        ),
        Promise.all(
          classIds.map((classId) =>
            quizApi.getQuizzes({ limit: 5 }).then((res) => ({
              classId,
              quizzes: (res.data || []).filter((q: any) => q.classId?._id === classId && q.status === 'published'),
            }))
          )
        ),
      ])

      const tasksMap: Record<string, ClassTask[]> = {}

      if (results[0].status === 'fulfilled') {
        results[0].value.forEach(({ classId, assignments }) => {
          if (!tasksMap[classId]) tasksMap[classId] = []
          assignments.forEach((a) => {
            tasksMap[classId].push({
              type: 'assignment',
              id: a._id,
              title: a.title,
              date: a.dueDate,
              status: a.status,
              link: `/student/assignments/${a._id}`,
            })
          })
        })
      }

      if (results[1].status === 'fulfilled') {
        results[1].value.forEach(({ classId, quizzes }) => {
          if (!tasksMap[classId]) tasksMap[classId] = []
          quizzes.forEach((q) => {
            tasksMap[classId].push({
              type: 'quiz',
              id: q._id,
              title: q.title,
              date: (q as any).endDate || (q as any).dueDate || (q as any).createdAt,
              status: q.status,
              link: `/student/quizzes/${q._id}`,
            })
          })
        })
      }

      setTasksByEnrollment(tasksMap)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load enrollments. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRemoveSaved = async (courseId: string) => {
    try {
      await savedCourseApi.toggleSaveCourse(courseId)
      setSavedCourses((prev) => prev.filter((item) => item.course._id !== courseId))
      toast.success('Course removed from saved list.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove saved course.')
    }
  }

  const openPaymentSummary = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
  }

  const handleProcessPayment = async () => {
    if (!selectedEnrollment) return
    setPaymentLoading(true)
    try {
      const result = await paymentApi.initiatePayment({
        courseId: selectedEnrollment.courseId._id,
        classId: selectedEnrollment.classId?._id,
      })
      redirectToPaymentGateway(result.gatewayUrl)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to start payment. Please try again.'
      toast.error(message)
      setPaymentLoading(false)
    }
  }

  const closePaymentSummary = () => {
    if (!paymentLoading) {
      setSelectedEnrollment(null)
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-4">
          <Skeleton variant="text" height="2rem" width="250px" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <Skeleton variant="text" height="1.25rem" width="200px" className="mb-2" />
                <Skeleton variant="text" height="1rem" width="300px" />
                <Skeleton variant="text" height="1rem" width="150px" className="mt-2" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <ErrorState
          title="Unable to load enrollments"
          message={error}
          onRetry={loadData}
          secondaryAction={
            <Button variant="primary" onClick={loadData}>
              Retry
            </Button>
          }
        />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">My Learning Hub</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your enrolled courses, classes, assignments, and saved courses.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
            activeTab === 'enrolled'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <BookOpenIcon className="h-4 w-4" />
          Enrolled Courses ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
            activeTab === 'saved'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <BookmarkIcon className="h-4 w-4" />
          Saved Courses ({savedCourses.length})
        </button>
      </div>

      {/* Tab 1: Enrolled Courses */}
      {activeTab === 'enrolled' && (
        <>
          {enrollments.length === 0 ? (
            <EmptyState
              title="No enrollments yet"
              description="You haven't enrolled in any courses yet. Explore our courses and start learning."
              icon={<InboxIcon className="h-12 w-12" />}
              action={
                <Link to="/courses">
                  <Button variant="primary">Explore Courses</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {enrollments.map((enrollment) => {
                const course = enrollment.courseId
                const cls = enrollment.classId
                const teacher = cls?.teacherId
                const tasks = tasksByEnrollment[cls?._id || ''] || []

                if (!course?._id) return null

                const paymentStatus = enrollment.paymentStatus
                const requiresPayment = paymentStatus === 'pending' || paymentStatus === 'failed'

                const upcomingAssignments = tasks
                  .filter((t) => t.type === 'assignment' && isUpcoming(t.date))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                const upcomingQuizzes = tasks
                  .filter((t) => t.type === 'quiz' && isUpcoming(t.date))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                const nearDeadlines = tasks.filter((t) => isDeadlineNear(t.date))

                return (
                  <div
                    key={enrollment._id}
                    className="rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-1 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpenIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-text">{course.title}</h3>
                            {cls?.batchName && (
                              <Badge variant="default" className="bg-primary/10 text-primary">
                                {cls.batchName}
                              </Badge>
                            )}

                            {requiresPayment && (
                              <Badge variant={paymentStatus === 'pending' ? 'warning' : 'error'}>
                                {paymentStatus === 'pending' ? 'Payment Pending' : paymentStatus}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <UsersIcon className="h-3.5 w-3.5" />
                              {teacher?.fullName || 'Instructor TBD'}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {cls?.startDate ? formatDate(cls.startDate) : 'Schedule TBD'}
                            </span>
                            <span>Batch: {cls?.batchName || 'Pending'}</span>
                          </div>

                          {nearDeadlines.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-secondary">
                              <AlertCircleIcon className="h-3.5 w-3.5" />
                              {nearDeadlines.length} deadline{nearDeadlines.length > 1 ? 's' : ''} approaching soon
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant={mapStatusBadge(enrollment.status).variant}>
                              {mapStatusBadge(enrollment.status).label}
                            </Badge>
                            <Badge variant={mapPaymentBadge(enrollment.paymentStatus).variant}>
                              {mapPaymentBadge(enrollment.paymentStatus).label}
                            </Badge>
                          </div>

                          {(upcomingAssignments.length > 0 || upcomingQuizzes.length > 0) && (
                            <div className="mt-3 space-y-1.5">
                              {upcomingAssignments.slice(0, 2).map((task) => (
                                <Link key={task.id} to={task.link} className="flex items-center gap-2 text-xs text-text-muted hover:text-primary">
                                  <FileTextIcon className="h-3.5 w-3.5" />
                                  <span className="truncate">{task.title}</span>
                                  <span className="text-text-muted">Due {formatDate(task.date)}</span>
                                </Link>
                              ))}
                              {upcomingQuizzes.slice(0, 2).map((task) => (
                                <Link key={task.id} to={task.link} className="flex items-center gap-2 text-xs text-text-muted hover:text-primary">
                                  <ClipboardListIcon className="h-3.5 w-3.5" />
                                  <span className="truncate">{task.title}</span>
                                  <span className="text-text-muted">Ends {formatDate(task.date)}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        {requiresPayment && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openPaymentSummary(enrollment)}
                            disabled={paymentLoading}
                          >
                            {paymentStatus === 'failed' ? 'Retry Payment' : 'Pay Now'}
                          </Button>
                        )}
                        {!requiresPayment && (
                          <Badge variant="success" className="hidden sm:inline-flex">
                            Paid
                          </Badge>
                        )}
                        <Link to={`/courses/${course.slug}`}>
                          <Button variant="outline" size="sm">
                            Course Info
                          </Button>
                        </Link>
                        {cls?._id ? (
                          <>
                            {(() => {
                              const cert = certificates.find((c) => String((c.classId as any)?._id || c.classId) === String(cls._id))
                              if (cert) {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveCert(cert)}
                                    className="border-amber-500/50 text-amber-700 bg-amber-50/50 hover:bg-amber-100 font-bold inline-flex items-center gap-1.5"
                                  >
                                    <AwardIcon className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Certificate</span>
                                  </Button>
                                )
                              }
                              return null
                            })()}
                            <Link to={`/student/classes/${cls._id}`}>
                              <Button variant="primary" size="sm">
                                Open Class Hub
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Badge variant="warning" className="text-xs">
                            Batch Pending
                          </Badge>
                        )}

                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Saved Courses */}
      {activeTab === 'saved' && (
        <>
          {savedCourses.length === 0 ? (
            <EmptyState
              title="No saved courses"
              description="You haven't saved any courses yet. When you find a course waiting for batch scheduling, you can save it to get notified when enrollment opens."
              icon={<BookmarkIcon className="h-12 w-12" />}
              action={
                <Link to="/courses">
                  <Button variant="primary">Browse Courses</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {savedCourses.map((item) => {
                const course = item.course
                if (!course) return null

                return (
                  <div
                    key={item._id}
                    className="rounded-xl border border-border bg-surface p-5 transition hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-1 gap-4 items-center">
                        <div className="h-16 w-20 rounded-lg overflow-hidden bg-primary/10 shrink-0">
                          {course.thumbnail ? (
                            <img src={getImageUrl(course.thumbnail)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center font-bold text-primary text-xl">
                              {course.title.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-text">{course.title}</h3>
                            {item.hasAvailableBatch ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/30 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Batch Open ({item.activeClassCount} Available)
                              </span>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                Waiting for Batch
                              </Badge>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-text-muted line-clamp-1">
                            {course.shortDescription || 'Course details available on course page.'}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                            <span className="font-semibold text-text">
                              {formatCurrency(course.offerPrice ?? course.price)}
                            </span>
                            <span>Category: {course.category}</span>
                            <span>Level: {course.difficulty}</span>
                            <span>Saved on: {formatDate(item.savedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSaved(course._id)}
                          className="text-error hover:bg-error/10"
                        >
                          Remove
                        </Button>
                        <Link to={`/courses/${course.slug}`}>
                          <Button
                            variant={item.hasAvailableBatch ? 'primary' : 'outline'}
                            size="sm"
                            className="font-bold"
                          >
                            {item.hasAvailableBatch ? 'Enroll Now ↗' : 'View Course'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {selectedEnrollment && (
        <PaymentSummary
          open={!!selectedEnrollment}
          onClose={closePaymentSummary}
          enrollment={selectedEnrollment}
          onConfirm={handleProcessPayment}
          loading={paymentLoading}
        />
      )}

      {activeCert && (
        <CertificateModal
          certificate={activeCert}
          open={Boolean(activeCert)}
          onClose={() => setActiveCert(null)}
        />
      )}
    </Container>
  )
}

