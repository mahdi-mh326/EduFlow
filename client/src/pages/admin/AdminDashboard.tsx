import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Badge, Skeleton, EmptyState, ErrorState } from '@/components'
import { adminApi } from '@/services/api/admin'
import { useAuthStore } from '@/stores/auth.store'
import {
  BookOpenIcon,
  UsersIcon,
  GraduationCapIcon,
  TrendingUpIcon,
} from '@/components/ui/icons'

export function AdminDashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled([
        adminApi.getCourses({ limit: 10 }),
        adminApi.getClasses({ limit: 10 }),
        adminApi.getTeachers({ limit: 10 }),
        adminApi.getEnrollments({ limit: 10 }),
        adminApi.getPayments({ limit: 10 }),
      ])

      const coursesResult = results[0]
      const classesResult = results[1]
      const teachersResult = results[2]
      const enrollmentsResult = results[3]
      const paymentsResult = results[4]

      if (coursesResult.status === 'fulfilled') {
        setCourses(coursesResult.value.data || [])
      }
      if (classesResult.status === 'fulfilled') {
        setClasses(classesResult.value.data || [])
      }
      if (teachersResult.status === 'fulfilled') {
        setTeachers(teachersResult.value.data || [])
      }
      if (enrollmentsResult.status === 'fulfilled') {
        setEnrollments(enrollmentsResult.value.data || [])
      }
      if (paymentsResult.status === 'fulfilled') {
        setPayments(paymentsResult.value.data || [])
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

  const recentEnrollments = useMemo(() => {
    return [...enrollments].sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()).slice(0, 5)
  }, [enrollments])

  const recentPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  }, [payments])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="text" height="2rem" width="300px" className="mb-2" />
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <Skeleton variant="text" height="1.5rem" width="180px" className="mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rect" height="72px" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <Skeleton variant="text" height="1.5rem" width="180px" className="mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rect" height="72px" />
              ))}
            </div>
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
          Welcome, {user?.fullName?.split(' ')[0] || 'Admin'}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage courses, classes, teachers, enrollments, and payments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Courses" value={courses.length.toString()} icon={<BookOpenIcon className="h-5 w-5 text-primary" />} />
        <StatCard label="Total Classes" value={classes.length.toString()} icon={<GraduationCapIcon className="h-5 w-5 text-secondary" />} />
        <StatCard label="Total Teachers" value={teachers.length.toString()} icon={<UsersIcon className="h-5 w-5 text-accent" />} />
        <StatCard label="Total Enrollments" value={enrollments.length.toString()} icon={<TrendingUpIcon className="h-5 w-5 text-success" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Recent Enrollments</h2>
            <Link to="/admin/enrollments" className="text-xs font-medium text-primary hover:text-primary/80">
              View All
            </Link>
          </div>

          {recentEnrollments.length === 0 ? (
            <EmptyState
              title="No enrollments yet"
              description="Enrollments will appear here once students join courses."
              icon={<UsersIcon className="h-12 w-12" />}
            />
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{enrollment.studentId?.fullName || 'Student'}</p>
                    <p className="text-xs text-text-muted truncate">{enrollment.courseId?.title || 'Course'} • {enrollment.classId?.batchName || 'Class'}</p>
                  </div>
                  <Badge variant={enrollment.paymentStatus === 'paid' ? 'success' : 'warning'} className="capitalize">
                    {enrollment.paymentStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Recent Payments</h2>
            <Link to="/admin/payments" className="text-xs font-medium text-primary hover:text-primary/80">
              View All
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Payment records will appear here."
              icon={<TrendingUpIcon className="h-12 w-12" />}
            />
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{payment.studentId?.fullName || 'Student'}</p>
                    <p className="text-xs text-text-muted truncate">{payment.courseId?.title || 'Course'} • {payment.classId?.batchName || 'Class'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">৳{payment.amount}</p>
                    <Badge variant={payment.status === 'paid' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'} className="capitalize">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Courses</h2>
            <Link to="/admin/courses" className="text-xs font-medium text-primary hover:text-primary/80">
              Manage
            </Link>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              title="No courses"
              description="Create your first course to get started."
              icon={<BookOpenIcon className="h-12 w-12" />}
            />
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 5).map((course) => (
                <div
                  key={course._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{course.title}</p>
                    <p className="text-xs text-text-muted">{course.category} • {course.difficulty}</p>
                  </div>
                  <Badge variant={course.status === 'published' ? 'success' : course.status === 'draft' ? 'default' : 'warning'} className="capitalize">
                    {course.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Teachers</h2>
            <Link to="/admin/teachers" className="text-xs font-medium text-primary hover:text-primary/80">
              Manage
            </Link>
          </div>

          {teachers.length === 0 ? (
            <EmptyState
              title="No teachers"
              description="Add teachers to your platform."
              icon={<UsersIcon className="h-12 w-12" />}
            />
          ) : (
            <div className="space-y-3">
              {teachers.slice(0, 5).map((teacher) => (
                <div
                  key={teacher._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {teacher.fullName?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{teacher.fullName}</p>
                      <p className="text-xs text-text-muted truncate">{teacher.email}</p>
                    </div>
                  </div>
                  <Badge variant={teacher.status === 'active' ? 'success' : teacher.status === 'pending' ? 'warning' : 'error'} className="capitalize">
                    {teacher.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
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
