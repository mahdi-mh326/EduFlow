import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState } from '@/components'
import { studentApi } from '@/services/api/student'
import { enrollmentApi } from '@/services/api/enrollment'
import { useAuthStore } from '@/stores/auth.store'
import {
  BookOpenIcon,
  TrendingUpIcon,
  PlayIcon,
  MonitorIcon,
  BellIcon,
  InboxIcon,
  AlertCircleIcon,
} from '@/components/ui/icons'
import type {
  StudentDashboardResponse,
  StudentLiveSession,
  StudentNotice,
} from '@/types/student'

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(time: string) {
  if (!time) return 'N/A'
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function getDayName(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

export function StudentDashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null)
  const [liveSessions, setLiveSessions] = useState<StudentLiveSession[]>([])
  const [notices, setNotices] = useState<StudentNotice[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled([
        studentApi.getDashboard(),
        studentApi.getLiveSessions(),
        studentApi.getNotices(),
        enrollmentApi.getEnrollments(),
      ])

      const dashboardResult = results[0]
      const sessionsResult = results[1]
      const noticesResult = results[2]
      const enrollmentsResult = results[3]

      if (dashboardResult.status === 'fulfilled') {
        setDashboard(dashboardResult.value)
      }
      if (sessionsResult.status === 'fulfilled') {
        setLiveSessions(sessionsResult.value)
      }
      if (noticesResult.status === 'fulfilled') {
        setNotices(noticesResult.value)
      }
      if (enrollmentsResult.status === 'fulfilled') {
        setEnrollments(enrollmentsResult.value)
      }

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length === results.length) {
        const messages = failed.map((r) => (r as PromiseRejectedResult).reason?.response?.data?.message || 'Request failed')
        const message = messages.join('; ')
        setError(message)
        toast.error(message)
      } else if (failed.length > 0) {
        const messages = failed.map((r) => (r as PromiseRejectedResult).reason?.response?.data?.message || 'Request failed')
        toast.error(messages.join('; '))
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load dashboard. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const enrollmentMap = useMemo(() => {
    const map = new Map<string, any>()
    enrollments.forEach((e) => {
      const key = e.courseId?._id
      if (key) map.set(key, e)
    })
    return map
  }, [enrollments])

  const enrichedEnrolledCourses = useMemo(() => {
    return (dashboard?.enrolledCourses ?? []).map((course) => {
      const enrollment = enrollmentMap.get(course.course._id)
      return {
        ...course,
        status: enrollment?.status,
        paymentStatus: enrollment?.paymentStatus,
      }
    })
  }, [dashboard, enrollmentMap])

  const enrolledCourses = enrichedEnrolledCourses
  const totalCourses = dashboard?.totalCourses ?? 0

  const upcomingSessions = useMemo(() => {
    return liveSessions.filter((s) => s.status === 'scheduled' || s.status === 'live').length
  }, [liveSessions])

  const totalEnrollments = useMemo(() => {
    return enrollments.length
  }, [enrollments])

  const upcomingClass = useMemo(() => {
    const now = new Date()
    const sorted = [...liveSessions].sort((a, b) => {
      const aDate = new Date(a.scheduledDate)
      const bDate = new Date(b.scheduledDate)
      const [aStartHour, aStartMinute] = a.startTime.split(':').map(Number)
      const [bStartHour, bStartMinute] = b.startTime.split(':').map(Number)
      const aStart = new Date(aDate)
      aStart.setHours(aStartHour, aStartMinute, 0, 0)
      const bStart = new Date(bDate)
      bStart.setHours(bStartHour, bStartMinute, 0, 0)
      return aStart.getTime() - bStart.getTime()
    })

    const current = sorted.find((session) => {
      const sessionDate = new Date(session.scheduledDate)
      const [startHour, startMinute] = session.startTime.split(':').map(Number)
      const [endHour, endMinute] = session.endTime.split(':').map(Number)
      const startDateTime = new Date(sessionDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)
      const endDateTime = new Date(sessionDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)
      return sessionDate.toDateString() === now.toDateString() && now >= startDateTime && now <= endDateTime
    })

    if (current) return current

    return sorted[0] || null
  }, [liveSessions])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="text" height="2rem" width="300px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="120px" className="mb-3" />
              <Skeleton variant="text" height="2rem" width="80px" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <Skeleton variant="text" height="1.5rem" width="200px" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height="80px" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load dashboard"
          message={error}
          onRetry={loadDashboard}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text sm:text-3xl">
          {greeting}, {user?.fullName?.split(' ')[0] || 'Student'}
        </h1>
        <p className="mt-1 text-text-muted">Keep learning and stay on track with your courses.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={totalCourses.toString()} icon={<BookOpenIcon className="h-5 w-5 text-primary" />} />
        <StatCard label="Total Enrollments" value={totalEnrollments.toString()} icon={<TrendingUpIcon className="h-5 w-5 text-secondary" />} />
        <StatCard label="Upcoming Classes" value={upcomingSessions.toString()} icon={<PlayIcon className="h-5 w-5 text-success" />} />
        <StatCard label="Notices" value={notices.length.toString()} icon={<BellIcon className="h-5 w-5 text-accent" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Continue Learning</h2>
              <Link to="/student/enrollments" className="text-sm font-medium text-primary hover:text-primary/80">
                View all
              </Link>
            </div>

            {enrolledCourses.length === 0 ? (
              <EmptyState
                title="No courses yet"
                description="Explore our courses and start your learning journey."
                icon={<InboxIcon className="h-12 w-12" />}
                action={
                  <Link to="/courses">
                    <Button variant="primary">Explore Courses</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {enrolledCourses.slice(0, 3).map((enrollment) => {
                  const course = enrollment.course
                  if (!course?._id) return null

                  return (
                    <div
                      key={enrollment.enrollmentDate + course._id}
                      className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-16 w-full shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary sm:w-24">
                        <MonitorIcon className="h-7 w-7 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-text">{course.title}</h3>
                          {enrollment.batch && (
                            <Badge variant="default" className="bg-primary/10 text-primary">
                              {enrollment.batch}
                            </Badge>
                          )}
                          {enrollment.paymentStatus && enrollment.paymentStatus !== 'paid' && enrollment.paymentStatus !== 'success' && (
                            <Badge variant={enrollment.paymentStatus === 'pending' ? 'warning' : 'error'}>
                              {enrollment.paymentStatus === 'pending' ? 'Payment Pending' : enrollment.paymentStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          Instructor: {enrollment.teacher?.fullName || 'Assigned Instructor'}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          Batch: {enrollment.batch || 'Assigned Batch'}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <Link to={`/courses/${course.slug}`}>
                          <Button variant="primary" size="sm">
                            View Course Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">My Courses</h2>
            <p className="mt-1 text-xs text-text-muted">Your enrolled courses and classes.</p>

            {enrolledCourses.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No courses yet"
                  description="Explore our courses and start your learning journey."
                  icon={<InboxIcon className="h-12 w-12" />}
                  action={
                    <Link to="/courses">
                      <Button variant="primary">Explore Courses</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {enrolledCourses.map((enrollment) => {
                  const course = enrollment.course
                  if (!course?._id) return null
                  return (
                    <div key={enrollment.enrollmentDate + course._id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpenIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text">{course.title}</p>
                          <p className="text-xs text-text-muted">
                            Batch: {enrollment.batch || 'Assigned'}
                          </p>
                          <p className="text-xs text-text-muted">
                            Instructor: {enrollment.teacher?.fullName || 'Assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:text-right">
                        <Badge variant={enrollment.status === 'active' ? 'success' : 'warning'}>
                          {enrollment.status === 'active' ? 'Active' : enrollment.status}
                        </Badge>
                        {enrollment.paymentStatus && (
                          <Badge variant={enrollment.paymentStatus === 'paid' || enrollment.paymentStatus === 'success' ? 'success' : enrollment.paymentStatus === 'failed' ? 'error' : 'warning'}>
                            {enrollment.paymentStatus === 'paid' || enrollment.paymentStatus === 'success' ? 'Paid' : enrollment.paymentStatus === 'pending' ? 'Payment Pending' : enrollment.paymentStatus}
                          </Badge>
                        )}
                        <Link to={`/courses/${course.slug}`}>
                          <Button variant="outline" size="sm">View Course</Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Next Class</h2>
            <p className="mt-1 text-xs text-text-muted">Your upcoming live session.</p>

            {!upcomingClass ? (
              <div className="mt-4 text-center py-6">
                <MonitorIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-text-muted">No upcoming classes</p>
                <p className="text-xs text-text-muted">Check back later for new sessions.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-text">{upcomingClass.title}</p>
                  <p className="text-xs text-text-muted">
                    {upcomingClass.classId?.batchName || 'Class Batch'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                  <div>
                    <p className="font-medium text-text">Day</p>
                    <p>{getDayName(upcomingClass.scheduledDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-text">Time</p>
                    <p>
                      {formatTime(upcomingClass.startTime)} – {formatTime(upcomingClass.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-text">Instructor</p>
                    <p>{upcomingClass.teacherId?.fullName || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-text">Date</p>
                    <p>{formatDate(upcomingClass.scheduledDate)}</p>
                  </div>
                </div>
                <Link to={`/student/classes/${upcomingClass._id}/classroom`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full">
                    Join Live Class
                  </Button>
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Latest Notices</h2>
            <p className="mt-1 text-xs text-text-muted">Updates from your classes.</p>

            {notices.length === 0 ? (
              <div className="mt-4 text-center py-6">
                <BellIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-text-muted">No notices yet</p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {notices.slice(0, 3).map((notice) => (
                  <div key={notice._id} className="py-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {notice.priority === 'high' ? (
                          <AlertCircleIcon className="h-4 w-4 text-secondary" />
                        ) : (
                          <BellIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text">{notice.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{notice.description}</p>
                        <p className="mt-1 text-xs text-text-muted">{formatDate(notice.publishDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
          {icon}
        </div>
        <div>
          <p className="text-xs text-text-muted">{label}</p>
          <p className="text-xl font-bold text-text">{value}</p>
        </div>
      </div>
    </div>
  )
}
