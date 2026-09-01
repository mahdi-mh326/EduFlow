import { useState, useEffect } from 'react'
import { Badge, Skeleton, EmptyState, ErrorState, Container, Button } from '@/components'
import { adminApi } from '@/services/api/admin'
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  InboxIcon,
  CalendarIcon,
} from '@/components/ui/icons'

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateString?: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' | 'default' {
  switch (status) {
    case 'present':
      return 'success'
    case 'late':
      return 'warning'
    case 'absent':
      return 'error'
    case 'excused':
      return 'neutral'
    default:
      return 'default'
  }
}

export function AdminAttendance() {
  const [attendances, setAttendances] = useState<any[]>([])
  const [report, setReport] = useState<{
    totalClasses: number
    present: number
    absent: number
    late: number
    excused: number
    attendancePercentage: number
  } | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = { page, limit: 20 }
      if (selectedCourseId) params.courseId = selectedCourseId
      if (selectedTeacherId) params.teacherId = selectedTeacherId
      if (selectedDate) params.date = selectedDate

      const [attendancesRes, reportRes, coursesRes, teachersRes] = await Promise.all([
        adminApi.getAttendances(params),
        adminApi.getAttendanceReport({
          courseId: selectedCourseId || undefined,
          teacherId: selectedTeacherId || undefined,
          date: selectedDate || undefined,
        }),
        adminApi.getCourses({ limit: 100 }),
        adminApi.getTeachers({ limit: 100 }),
      ])

      setAttendances(attendancesRes.data || [])
      if (attendancesRes.meta) {
        setTotalPages(attendancesRes.meta.totalPages || 1)
      }
      setReport(reportRes.data || null)
      setCourses(coursesRes.data || [])
      setTeachers(teachersRes.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load attendance report.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, selectedCourseId, selectedTeacherId, selectedDate])

  if (loading && !report) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="350px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="80px" className="mb-3" />
              <Skeleton variant="text" height="2rem" width="50px" />
            </div>
          ))}
        </div>
        <Skeleton variant="rect" height="300px" />
      </Container>
    )
  }

  if (error && !report) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Attendance & Reports</h1>
          <p className="mt-1 text-sm text-text-muted">Track attendance records and student participation statistics.</p>
        </div>
        <ErrorState title="Unable to load attendance" message={error} onRetry={loadData} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Attendance Analytics & Reports</h1>
        <p className="mt-1 text-sm text-text-muted">Platform-wide attendance analytics, class records, and student presence history.</p>
      </div>

      {report && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Classes</p>
                <p className="text-xl font-bold text-text">{report.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <CheckCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Present %</p>
                <p className="text-xl font-bold text-success">{report.attendancePercentage}%</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Late</p>
                <p className="text-xl font-bold text-warning">{report.late}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
                <XCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Absent</p>
                <p className="text-xl font-bold text-error">{report.absent}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-text-muted/10 text-text-muted">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Excused</p>
                <p className="text-xl font-bold text-text">{report.excused}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={selectedCourseId}
          onChange={(e) => { setSelectedCourseId(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>

        <select
          value={selectedTeacherId}
          onChange={(e) => { setSelectedTeacherId(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All Instructors</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>{t.fullName}</option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />

        {(selectedCourseId || selectedTeacherId || selectedDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCourseId('')
              setSelectedTeacherId('')
              setSelectedDate('')
              setPage(1)
            }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Attendance Logs</h2>
          <span className="text-xs text-text-muted">{attendances.length} records</span>
        </div>

        {attendances.length === 0 ? (
          <EmptyState
            title="No attendance records"
            description="There are no attendance records matching the selected criteria."
            icon={<InboxIcon className="h-12 w-12" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] divide-y divide-border">
              <thead>
                <tr className="bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Class & Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Join Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {attendances.map((rec) => (
                  <tr key={rec._id} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {rec.studentId?.fullName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text truncate">{rec.studentId?.fullName}</p>
                          <p className="text-xs text-text-muted truncate">{rec.studentId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text">{rec.classId?.batchName || 'Class'}</p>
                      <p className="text-xs text-text-muted">{rec.courseId?.title || 'Course'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{formatDate(rec.date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(rec.status)} className="capitalize">
                        {rec.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {rec.joinedAt ? formatTime(rec.joinedAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted uppercase text-xs">
                      {rec.method || 'manual'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}
