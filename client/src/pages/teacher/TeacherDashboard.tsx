import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Badge, Skeleton, EmptyState, ErrorState, Button } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import { useAuthStore } from '@/stores/auth.store'
import { getAvatarUrl } from '@/utils'
import {
  BookOpenIcon,
  UsersIcon,
  MonitorIcon,
  BellIcon,
  AlertCircleIcon,
  ClockIcon,
  FileTextIcon,
  ClipboardListIcon,
  ChevronRightIcon,
  CalendarIcon,
} from '@/components/ui/icons'

import type {
  TeacherClass,
  TeacherEnrollment,
  TeacherNotice,
  TeacherAssignment,
  TeacherQuiz,
} from '@/types/teacher'

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(time?: string) {
  if (!time) return 'N/A'
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function getStatusVariant(status?: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'ongoing':
    case 'active':
    case 'live':
      return 'success'
    case 'upcoming':
    case 'scheduled':
      return 'default'
    case 'completed':
    case 'published':
      return 'primary'
    case 'cancelled':
    case 'closed':
      return 'error'
    default:
      return 'default'
  }
}

export function TeacherDashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [enrollments, setEnrollments] = useState<TeacherEnrollment[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [notices, setNotices] = useState<TeacherNotice[]>([])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled([
        teacherApi.getClasses({ limit: 50, teacherId: user?.id }),
        teacherApi.getEnrollments(),
        teacherApi.getAssignments({ limit: 20 }),
        teacherApi.getQuizzes({ limit: 20 }),
        teacherApi.getNotices({ limit: 10 }),
      ])

      const [classesRes, enrollmentsRes, assignmentsRes, quizzesRes, noticesRes] = results

      if (classesRes.status === 'fulfilled') {
        setClasses(classesRes.value.data || [])
      }
      if (enrollmentsRes.status === 'fulfilled') {
        setEnrollments(enrollmentsRes.value.data || [])
      }
      if (assignmentsRes.status === 'fulfilled') {
        setAssignments(assignmentsRes.value.data || [])
      }
      if (quizzesRes.status === 'fulfilled') {
        setQuizzes(quizzesRes.value.data || [])
      }
      if (noticesRes.status === 'fulfilled') {
        setNotices(noticesRes.value.data || [])
      }

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length === results.length) {
        const message = 'Unable to load dashboard data. Please check your connection.'
        setError(message)
        toast.error(message)
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load dashboard.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const teacherId = user?.id

  // Filter teacher's assigned classes
  const myClasses = useMemo(() => {
    if (!teacherId) return classes
    return classes.filter((cls) => {
      const tId = (cls.teacherId as any)?._id || (cls.teacherId as any)?.id || cls.teacherId
      return String(tId) === String(teacherId)
    })
  }, [classes, teacherId])

  const myClassIdSet = useMemo(() => new Set(myClasses.map((c) => String(c._id))), [myClasses])

  // Filter enrollments for my classes
  const myEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const cid = (e.classId as any)?._id || (e.classId as any)?.id || e.classId
      return myClassIdSet.has(String(cid))
    })
  }, [enrollments, myClassIdSet])

  // Compute unique students
  const uniqueStudents = useMemo(() => {
    const studentMap = new Map<string, any>()
    myEnrollments.forEach((e) => {
      const s = e.studentId
      const sid = s?._id || (s as any)?.id || s
      if (sid && !studentMap.has(String(sid))) {
        studentMap.set(String(sid), s)
      }
    })

    return Array.from(studentMap.values())
  }, [myEnrollments])

  // Today's Scheduled Classes
  const todayClasses = useMemo(() => {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const todayShort = todayName.slice(0, 3)

    return myClasses.filter((cls) => {
      return cls.classDays?.some((day) => {
        const d = day.toLowerCase()
        return d.includes(todayShort) || d === todayName
      })
    })
  }, [myClasses])

  // Teacher's assignments and quizzes
  const myAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const cid = (a.classId as any)?._id || (a.classId as any)?.id || a.classId
      return myClassIdSet.has(String(cid))
    })
  }, [assignments, myClassIdSet])

  const myQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const cid = (q.classId as any)?._id || (q.classId as any)?.id || q.classId
      return myClassIdSet.has(String(cid))
    })
  }, [quizzes, myClassIdSet])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" height="2.5rem" width="320px" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="100px" className="mb-2" />
              <Skeleton variant="text" height="2rem" width="60px" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton variant="rect" height="300px" className="rounded-xl" />
          <Skeleton variant="rect" height="300px" className="rounded-xl" />
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
      {/* Greeting Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">
            {greeting}, {user?.fullName?.split(' ')[0] || 'Teacher'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Here is your live teaching schedule and class overview for today.
          </p>
        </div>
        <Link to="/teacher/classes">
          <Button variant="primary" className="gap-2 shadow-sm">
            <BookOpenIcon className="h-4 w-4" />
            Go to My Classes
          </Button>
        </Link>
      </div>

      {/* Real-Time Metrics Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Classes"
          value={myClasses.length.toString()}
          icon={<BookOpenIcon className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Enrolled Students"
          value={uniqueStudents.length.toString()}
          icon={<UsersIcon className="h-5 w-5 text-secondary" />}
        />
        <StatCard
          label="Class Assignments"
          value={myAssignments.length.toString()}
          icon={<FileTextIcon className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          label="Class Quizzes"
          value={myQuizzes.length.toString()}
          icon={<ClipboardListIcon className="h-5 w-5 text-amber-600" />}
        />
      </div>

      {/* Today's Live Teaching Schedule Hero */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-surface to-background p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Today's Class Schedule</h2>
              <p className="text-xs text-text-muted">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'} scheduled today
          </span>
        </div>

        <div className="mt-4">
          {todayClasses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-text">No classes scheduled for today.</p>
              <p className="text-xs text-text-muted mt-1">
                You can review study materials, assignments, or prepare for upcoming classes.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {todayClasses.map((cls) => {
                const enrolledCount = myEnrollments.filter(
                  (e) => String((e.classId as any)?._id || e.classId) === String(cls._id)
                ).length

                return (
                  <div
                    key={cls._id}
                    className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-text text-sm sm:text-base">{cls.batchName}</h3>
                          <p className="text-xs text-text-muted mt-0.5">{cls.courseId?.title || 'Course'}</p>
                        </div>
                        <Badge variant={getStatusVariant(cls.status)} className="capitalize text-xs">
                          {cls.status}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1 font-medium text-text">
                          <ClockIcon className="h-3.5 w-3.5 text-primary" />
                          {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon className="h-3.5 w-3.5 text-primary" />
                          {enrolledCount} Students
                        </span>
                      </div>
                    </div>

                    <Link to={`/teacher/classes/${cls._id}`}>
                      <Button variant="primary" size="sm" className="w-full gap-1.5 shadow-sm">
                        <MonitorIcon className="h-4 w-4" />
                        Open Class & Start Live
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: My Assigned Classes & Recent Assignments/Quizzes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Classes */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text">My Assigned Classes</h2>
              <p className="text-xs text-text-muted">All active and upcoming classes assigned to you</p>
            </div>
            <Link to="/teacher/classes" className="text-xs font-semibold text-primary hover:underline">
              View All ({myClasses.length})
            </Link>
          </div>

          {myClasses.length === 0 ? (
            <EmptyState
              title="No assigned classes"
              description="When administration assigns you to a class, it will appear here."
              icon={<BookOpenIcon className="h-10 w-10" />}
            />
          ) : (
            <div className="space-y-3">
              {myClasses.slice(0, 5).map((cls) => {
                const enrolledCount = myEnrollments.filter(
                  (e) => String((e.classId as any)?._id || e.classId) === String(cls._id)
                ).length

                return (
                  <div
                    key={cls._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 hover:border-border/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text truncate">{cls.batchName}</p>
                        <Badge variant={getStatusVariant(cls.status)} className="capitalize text-xs">
                          {cls.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted truncate mt-0.5">{cls.courseId?.title || 'Course'}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span>{cls.classDays?.join(', ') || 'No days'}</span>
                        <span>{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</span>
                        <span>{enrolledCount} Students</span>
                      </div>
                    </div>

                    <Link to={`/teacher/classes/${cls._id}`} className="shrink-0">
                      <Button variant="outline" size="sm" className="gap-1">
                        Open <ChevronRightIcon className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Class Assignments & Pending Grading */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text">Class Assignments & Homework</h2>
              <p className="text-xs text-text-muted">Assignments created across your classes</p>
            </div>
          </div>

          {myAssignments.length === 0 ? (
            <EmptyState
              title="No assignments created"
              description="Create assignments from inside your class hubs to track student submissions."
              icon={<FileTextIcon className="h-10 w-10" />}
            />
          ) : (
            <div className="space-y-3">
              {myAssignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment._id}
                  className="rounded-xl border border-border bg-background p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text truncate">{assignment.title}</p>
                      <Badge variant={getStatusVariant(assignment.status)} className="capitalize text-xs">
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {assignment.courseId?.title || 'Course'} • {assignment.classId?.batchName || 'Class'}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Due: {formatDate(assignment.dueDate)} • {assignment.totalMarks} Marks
                    </p>
                  </div>

                  <Link to={`/teacher/assignments/${assignment._id}`} className="shrink-0">
                    <Button variant="outline" size="sm">
                      Submissions
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bottom Grid: Enrolled Students Roster & Class Notices */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrolled Students Roster */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text">Students Roster</h2>
              <p className="text-xs text-text-muted">{uniqueStudents.length} total enrolled students</p>
            </div>
          </div>

          {uniqueStudents.length === 0 ? (
            <EmptyState
              title="No enrolled students"
              description="Students enrolled in your classes will appear in this roster."
              icon={<UsersIcon className="h-10 w-10" />}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {uniqueStudents.slice(0, 6).map((student: any) => (
                <div
                  key={student._id || student.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                    {student?.avatar ? (
                      <img src={getAvatarUrl(student.avatar)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      student?.fullName?.charAt(0).toUpperCase() || 'S'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text truncate">{student?.fullName || 'Student'}</p>
                    <p className="text-xs text-text-muted truncate">{student?.email || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Class Notices */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text">Recent Class Notices</h2>
              <p className="text-xs text-text-muted">{notices.length} total announcements</p>
            </div>
          </div>

          {notices.length === 0 ? (
            <EmptyState
              title="No notices yet"
              description="Notices posted to classes will appear here."
              icon={<BellIcon className="h-10 w-10" />}
            />
          ) : (
            <div className="divide-y divide-border">
              {notices.slice(0, 4).map((notice) => (
                <div key={notice._id} className="py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {notice.priority === 'high' ? (
                      <AlertCircleIcon className="h-4 w-4 text-error" />
                    ) : (
                      <BellIcon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text truncate">{notice.title}</p>
                      {notice.priority && (
                        <Badge
                          variant={notice.priority === 'high' ? 'error' : notice.priority === 'medium' ? 'warning' : 'default'}
                          className="capitalize text-[10px]"
                        >
                          {notice.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{notice.description || (notice as any).content || 'No description'}</p>
                    <p className="mt-1 text-[11px] text-text-muted">{formatDate(notice.createdAt || (notice as any).publishDate)}</p>
                  </div>
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
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs text-text-muted font-medium">{label}</p>
          <p className="text-xl font-bold text-text mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  )
}
