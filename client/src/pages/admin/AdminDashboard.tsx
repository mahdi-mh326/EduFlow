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
  const [teachers, setTeachers] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [counts, setCounts] = useState({
    students: 0,
    courses: 0,
    classes: 0,
    teachers: 0,
    enrollments: 0,
  })

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
        adminApi.getStudents({ limit: 1 }),
      ])

      const coursesResult = results[0]
      const classesResult = results[1]
      const teachersResult = results[2]
      const enrollmentsResult = results[3]
      const paymentsResult = results[4]
      const studentsResult = results[5]

      if (coursesResult.status === 'fulfilled') {
        setCourses(coursesResult.value.data || [])
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

      setCounts({
        students: studentsResult.status === 'fulfilled' ? studentsResult.value.meta?.total ?? 0 : 0,
        courses: coursesResult.status === 'fulfilled' ? coursesResult.value.meta?.total ?? coursesResult.value.data?.length ?? 0 : 0,
        classes: classesResult.status === 'fulfilled' ? classesResult.value.meta?.total ?? classesResult.value.data?.length ?? 0 : 0,
        teachers: teachersResult.status === 'fulfilled' ? teachersResult.value.meta?.total ?? teachersResult.value.data?.length ?? 0 : 0,
        enrollments: enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value.meta?.total ?? enrollmentsResult.value.data?.length ?? 0 : 0,
      })


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

  const totalRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payments])

  const monthlyAnalytics = useMemo(() => {
    const months: Array<{ month: string; revenue: number; enrollments: number }> = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mName = d.toLocaleDateString('en-US', { month: 'short' })

      const mPayments = payments.filter((p) => {
        if (p.status !== 'paid') return false
        const pDate = new Date(p.createdAt || p.paidAt || p.enrolledAt)
        return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth()
      })
      const mRev = mPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

      const mEnrolls = enrollments.filter((e) => {
        const eDate = new Date(e.enrolledAt || e.createdAt)
        return eDate.getFullYear() === d.getFullYear() && eDate.getMonth() === d.getMonth()
      })

      months.push({
        month: mName,
        revenue: mRev,
        enrollments: mEnrolls.length,
      })
    }
    return months
  }, [payments, enrollments])

  const maxMonthRev = useMemo(() => {
    const max = Math.max(...monthlyAnalytics.map((m) => m.revenue), 1000)
    return max
  }, [monthlyAnalytics])

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
          Platform overview, financial growth, and real-time operations.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total Revenue" value={`৳${totalRevenue.toLocaleString()}`} icon={<TrendingUpIcon className="h-5 w-5 text-emerald-600" />} to="/admin/payments" />
        <StatCard label="Total Students" value={counts.students.toString()} icon={<UsersIcon className="h-5 w-5 text-indigo-500" />} to="/admin/students" />
        <StatCard label="Total Courses" value={counts.courses.toString()} icon={<BookOpenIcon className="h-5 w-5 text-primary" />} to="/admin/courses" />
        <StatCard label="Total Classes" value={counts.classes.toString()} icon={<GraduationCapIcon className="h-5 w-5 text-secondary" />} to="/admin/classes" />
        <StatCard label="Total Teachers" value={counts.teachers.toString()} icon={<UsersIcon className="h-5 w-5 text-accent" />} to="/admin/teachers" />
        <StatCard label="Total Enrollments" value={counts.enrollments.toString()} icon={<UsersIcon className="h-5 w-5 text-primary" />} to="/admin/enrollments" />
      </div>


      {/* Visual Revenue & Enrollment Analytics */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text">Revenue & Admissions Growth</h2>
            <p className="text-xs text-text-muted">Monthly earnings overview and admissions growth trajectory</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-text">
              <span className="h-3 w-3 rounded-sm bg-primary inline-block" />
              Revenue (৳)
            </span>
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" />
              New Students
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-6 pt-6 pb-2 items-end h-56 border-b border-border">
          {monthlyAnalytics.map((item, idx) => {
            const heightPercent = Math.max(10, Math.round((item.revenue / maxMonthRev) * 100))
            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] sm:text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ৳{item.revenue.toLocaleString()}
                </div>
                <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                    style={{ height: `${heightPercent}%` }}
                    title={`Revenue: ৳${item.revenue.toLocaleString()}`}
                  />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-text-muted mt-2">
                  {item.month}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">
                  +{item.enrollments} std
                </div>
              </div>
            )
          })}
        </div>
      </section>


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

function StatCard({ label, value, icon, to }: { label: string; value: string; icon: React.ReactNode; to?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-xl font-bold text-text">{value}</p>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="rounded-xl border border-border bg-surface p-5 hover:border-primary/50 transition-colors block shadow-xs hover:shadow-sm">
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      {content}
    </div>
  )
}
