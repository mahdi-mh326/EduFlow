import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Badge, Container, ErrorState, Skeleton } from '@/components'
import { EnrollmentModal } from '@/components/enrollment'
import { courseApi, type ClassResponse, type CourseResponse } from '@/services/api/course'
import { enrollmentApi } from '@/services/api/enrollment'
import { savedCourseApi } from '@/services/api/savedCourse'

import { useAuthStore } from '@/stores/auth.store'

import { BookOpenIcon, CheckCircleIcon, ClockIcon, MonitorIcon, UsersIcon } from '@/components/ui/icons'
import { formatCurrency, formatDate, getImageUrl } from '@/utils'
import { toast } from 'react-hot-toast'


const gradients = ['from-primary/20 to-primary/5', 'from-secondary/20 to-secondary/5', 'from-accent/30 to-accent/5']

function getGradient(category: string) {
  const index = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length
  return gradients[index]
}

function formatDuration(value: number, unit: string) {
  return Number.isFinite(value) && unit ? `${value} ${unit}${value === 1 ? '' : 's'}` : 'Duration N/A'
}

function formatTime(value: string) {
  if (!value) return 'Time N/A'
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 'Time N/A'
  const period = hours >= 12 ? 'PM' : 'AM'
  return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function mapCourseStatus(status: string) {
  switch (status) {
    case 'published': return { label: 'Published', variant: 'success' as const }
    case 'archived': return { label: 'Archived', variant: 'warning' as const }
    default: return { label: status || 'Unavailable', variant: 'default' as const }
  }
}

export function CourseDetails() {

  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [relatedCourses, setRelatedCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [classesLoading, setClassesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const loadCourse = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const data = await courseApi.getCourseBySlug(courseId)
      setCourse(data)
      setClassesLoading(true)
      const [classResult, relatedResult] = await Promise.all([
        courseApi.getClasses({ courseId: data._id, limit: 50 }),
        courseApi.getCourses({ category: data.category, limit: 4, sortBy: 'newest', sortOrder: 'desc' }),
      ])
      setClasses(classResult.data)
      setRelatedCourses(relatedResult.data.filter((item) => item.slug !== data.slug).slice(0, 3))
    } catch (err: any) {
      setError(err?.response?.status === 404 ? 'This course was not found or is no longer available.' : err?.response?.data?.message || 'Unable to load this course.')
      setCourse(null)
      setClasses([])
      setRelatedCourses([])
    } finally {
      setClassesLoading(false)
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { loadCourse() }, [loadCourse])

  useEffect(() => {
    if (!isAuthenticated || !courseId) {
      setEnrollmentStatus(null)
      setIsSaved(false)
      return
    }
    setEnrollmentsLoading(true)
    enrollmentApi.getEnrollments()
      .then((enrollments) => setEnrollmentStatus(enrollments.find((item: any) => item.courseId?.slug === courseId)?.status || null))
      .catch(() => setEnrollmentStatus(null))
      .finally(() => setEnrollmentsLoading(false))

    if (course?._id && user?.role === 'student') {
      savedCourseApi.checkCourseSaved(course._id)
        .then((res) => setIsSaved(res.isSaved))
        .catch(() => setIsSaved(false))
    }
  }, [courseId, course?._id, isAuthenticated, user?.role])

  const handleToggleSaveCourse = async () => {
    if (!course) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${course.slug}` } } })
      return
    }
    if (user?.role !== 'student') {
      toast.error('Only students can save courses.')
      return
    }
    setSaveLoading(true)
    try {
      const res = await savedCourseApi.toggleSaveCourse(course._id)
      setIsSaved(res.isSaved)
      if (res.isSaved) {
        toast.success('Course saved! You will be notified as soon as a class batch opens.')
      } else {
        toast.success('Course removed from your saved list.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update saved status.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleEnroll = () => {
    if (!course) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${course.slug}` } } })
      return
    }
    if (user?.role !== 'student') {
      toast.error('Only students can enroll in courses.')
      return
    }
    setShowEnrollmentModal(true)
  }

  const enrollmentAction = () => {
    if (!course) return null
    if (enrollmentsLoading || classesLoading) return <Button fullWidth size="lg" disabled>Loading...</Button>
    if (enrollmentStatus === 'active') return <Link to="/student/dashboard"><Button fullWidth size="lg">View My Course</Button></Link>
    if (user && user.role !== 'student') return <Button fullWidth size="lg" variant="outline" disabled>Student enrollment only</Button>

    // If no class batch is created yet for this course:
    if (classes.length === 0) {
      return (
        <div className="space-y-2">
          <Button
            fullWidth
            size="lg"
            variant={isSaved ? 'outline' : 'primary'}
            onClick={handleToggleSaveCourse}
            disabled={saveLoading}
            className="gap-2 font-bold"
          >
            {saveLoading ? 'Processing...' : isSaved ? '✓ Course Saved (We\'ll Notify You)' : '🔖 Save Course & Notify Me'}
          </Button>
          <p className="text-center text-xs text-text-muted">
            No class batch scheduled yet. Save this course to receive an instant notification when enrollment opens.
          </p>
        </div>
      )
    }

    return (
      <Button fullWidth size="lg" onClick={handleEnroll} className="font-bold">
        {enrollmentStatus === 'cancelled' ? 'Enroll Again' : 'Enroll Now'}
      </Button>
    )
  }


  if (loading) {
    return <Container className="py-10"><div className="space-y-5"><Skeleton variant="text" height="1rem" width="180px" /><Skeleton variant="text" height="2.5rem" width="70%" /><Skeleton variant="text" height="1rem" width="90%" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton variant="rect" height="22rem" className="lg:col-span-2" /><Skeleton variant="rect" height="22rem" /></div></div></Container>
  }

  if (error || !course) {
    return <Container className="py-16"><ErrorState title="Unable to load course" message={error || 'Course not found.'} onRetry={loadCourse} secondaryAction={<Link to="/courses"><Button variant="outline">Browse courses</Button></Link>} /></Container>
  }

  const status = mapCourseStatus(course.status)
  const hasOffer = typeof course.offerPrice === 'number' && course.offerPrice < course.price

  return (
    <section className="bg-background pb-16">
      <Container>
        <nav className="mb-5 mt-6 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/courses" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Courses</Link></li>
            <li aria-hidden="true">/</li>
            <li className="max-w-[min(60vw,28rem)] truncate text-text" aria-current="page">{course.title}</li>
          </ol>
        </nav>

        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="min-w-0 p-6 sm:p-8 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="bg-primary/10 text-primary">{course.category || 'Course'}</Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
                {hasOffer && <Badge variant="warning" className="bg-accent text-text">Offer</Badge>}
              </div>
              <h1 className="mt-3 break-words text-2xl font-bold text-text sm:text-3xl">{course.title}</h1>
              <p className="mt-3 text-text-muted">{course.shortDescription || 'Course overview not available.'}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" />{formatDuration(course.durationValue, course.durationUnit)}</span>
                <span className="rounded-full bg-background px-2 py-0.5 capitalize ring-1 ring-border">{course.difficulty || 'Level N/A'}</span>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold text-text">About this course</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{course.description || course.shortDescription || 'Description not available.'}</p>
              </div>

              <div className="mt-8 rounded-xl border border-border bg-background p-5">
                <h2 className="text-lg font-semibold text-text">Class Batches & Schedules</h2>
                {classes.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-3">
                    <p className="text-xs font-semibold text-amber-700">
                      No active class batches have been scheduled yet for this course.
                    </p>
                    <p className="text-xs text-text-muted max-w-md mx-auto">
                      Save this course to your wishlist and we will immediately notify you via email and in-app alert when a teacher opens a new batch.
                    </p>
                    <Button
                      size="sm"
                      variant={isSaved ? 'outline' : 'primary'}
                      onClick={handleToggleSaveCourse}
                      disabled={saveLoading}
                      className="gap-1.5"
                    >
                      {isSaved ? '✓ Course Saved (We\'ll Notify You)' : '🔖 Save Course & Notify Me'}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">

                    {classes.map((item) => (
                      <div key={item._id} className="rounded-xl border border-border bg-surface p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-text">{item.batchName}</h3>
                            <p className="mt-1 text-xs font-medium text-primary">
                              👨‍🏫 Instructor: {item.teacherId?.fullName || 'Assigned Instructor'}
                            </p>
                          </div>
                          <Badge variant={item.status === 'ongoing' ? 'success' : item.status === 'upcoming' ? 'primary' : 'neutral'} className="capitalize">
                            {item.status || 'N/A'}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
                          <div className="rounded-lg bg-slate-50 border border-border/60 p-2.5">
                            <span className="font-semibold text-text block mb-0.5">🗓️ Class Days</span>
                            <span>{item.classDays?.join(', ') || 'Schedule TBD'}</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 border border-border/60 p-2.5">
                            <span className="font-semibold text-text block mb-0.5">⏰ Class Timing</span>
                            <span>{formatTime(item.startTime)} – {formatTime(item.endTime)}</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 border border-border/60 p-2.5 sm:col-span-2">
                            <span className="font-semibold text-text block mb-0.5">📅 Batch Duration</span>
                            <span>{formatDate(item.startDate)} to {formatDate(item.endDate)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  [<MonitorIcon key="live" className="h-4 w-4 text-primary" />, 'Live classes', 'Attend scheduled sessions with your class.'],
                  [<BookOpenIcon key="materials" className="h-4 w-4 text-primary" />, 'Course materials', 'Access learning materials shared by your instructor.'],
                  [<CheckCircleIcon key="assignments" className="h-4 w-4 text-primary" />, 'Assignments', 'Practice and submit work from your learning area.'],
                  [<UsersIcon key="community" className="h-4 w-4 text-primary" />, 'Community', 'Learn alongside your enrolled classmates.'],
                ].map(([icon, title, description]) => <div key={title as string} className="rounded-xl border border-border bg-background p-4"><div className="flex items-center gap-2">{icon}<h3 className="text-sm font-semibold text-text">{title}</h3></div><p className="mt-2 text-xs text-text-muted">{description}</p></div>)}
              </div>
            </div>

            <div className="border-t border-border lg:border-l lg:border-t-0">
              <div className="p-6 sm:p-8 lg:sticky lg:top-20">
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className={`relative h-40 bg-gradient-to-br ${getGradient(course.category)}`}>
                    {course.banner || course.thumbnail ? <img src={getImageUrl(course.banner || course.thumbnail)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl font-semibold text-primary/40" aria-hidden="true">{course.title.charAt(0).toUpperCase()}</div>}
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-baseline gap-2"><span className="text-2xl font-bold text-text">{formatCurrency(hasOffer ? course.offerPrice : course.price)}</span>{hasOffer && <span className="text-sm text-text-muted line-through">{formatCurrency(course.price)}</span>}</div>
                    <div className="mt-4">{enrollmentAction()}</div>
                    {enrollmentStatus === 'active' && <p className="mt-2 text-center text-xs text-success">You are enrolled in this course.</p>}
                    {!isAuthenticated && <p className="mt-2 text-center text-xs text-text-muted">Sign in to enroll and start learning.</p>}
                    <div className="mt-5 space-y-2 text-xs text-text-muted"><p className="flex items-center gap-2"><ClockIcon className="h-4 w-4" />{formatDuration(course.durationValue, course.durationUnit)}</p><p className="flex items-center gap-2"><BookOpenIcon className="h-4 w-4" />{course.category || 'Course'} curriculum</p><p className="flex items-center gap-2"><MonitorIcon className="h-4 w-4" />Live sessions where scheduled</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedCourses.length > 0 && <div className="mt-12"><h2 className="text-xl font-bold text-text">More in {course.category}</h2><div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{relatedCourses.map((item) => <Link key={item._id} to={`/courses/${item.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="h-full rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className={`h-28 rounded-lg bg-gradient-to-br ${getGradient(item.category)}`}>{item.thumbnail ? <img src={getImageUrl(item.thumbnail)} alt="" className="h-full w-full rounded-lg object-cover" /> : <div className="flex h-full items-center justify-center text-3xl font-semibold text-primary/40" aria-hidden="true">{item.title.charAt(0).toUpperCase()}</div>}</div><Badge variant="default" className="mt-3 bg-primary/10 text-primary">{item.category}</Badge><h3 className="mt-2 line-clamp-2 text-sm font-semibold text-text">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs text-text-muted">{item.shortDescription}</p><p className="mt-3 text-sm font-semibold text-text">{formatCurrency(item.offerPrice ?? item.price)}</p></div></Link>)}</div></div>}

      </Container>

      {showEnrollmentModal && (
        <EnrollmentModal
          open={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          courseId={course._id}
          courseTitle={course.title}
          coursePrice={course.offerPrice ?? course.price}
          classes={classes}
          onSuccess={() => {
            setEnrollmentStatus('active')
            setIsSaved(false)
            setShowEnrollmentModal(false)
          }}
        />

      )}
    </section>
  )
}

