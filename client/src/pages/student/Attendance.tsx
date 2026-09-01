import { useState, useEffect, useCallback } from 'react'
import { Badge, Skeleton, ErrorState, EmptyState, Container, Pagination } from '@/components'
import { studentApi } from '@/services/api/student'
import { BookOpenIcon, InboxIcon } from '@/components/ui/icons'
import type { StudentAttendance } from '@/types/student'

function formatDate(dateString: string) {
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'present':
      return { label: 'Present', variant: 'success' as const }
    case 'absent':
      return { label: 'Absent', variant: 'error' as const }
    case 'late':
      return { label: 'Late', variant: 'warning' as const }
    case 'excused':
      return { label: 'Excused', variant: 'neutral' as const }
    default:
      return { label: status, variant: 'default' as const }
  }
}

export function Attendance() {
  const [attendance, setAttendance] = useState<StudentAttendance[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const loadAttendance = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const attendanceResult = await studentApi.getAttendance({ page, limit: 10 })
      setAttendance(attendanceResult.data)
      setMeta(attendanceResult.meta)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load attendance. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAttendance(currentPage)
  }, [loadAttendance, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="120px" className="mb-3" />
              <Skeleton variant="text" height="2rem" width="80px" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height="60px" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Attendance</h1>
          <p className="mt-1 text-sm text-text-muted">View your attendance history and report.</p>
        </div>
        <ErrorState title="Unable to load attendance" message={error} onRetry={() => loadAttendance(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Attendance</h1>
        <p className="mt-1 text-sm text-text-muted">View your attendance history and report.</p>
      </div>

      {attendance.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="Your attendance records will appear here once you join live classes."
          icon={<InboxIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Course</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Class</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Session</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.map((record) => {
                  const statusBadge = getStatusBadge(record.status)
                  return (
                    <tr key={record._id} className="hover:bg-background transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BookOpenIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium text-text">{record.course?.title || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{record.class?.batchName || 'N/A'}</td>
                      <td className="px-4 py-3 text-text-muted">{record.liveSession?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(record.attendanceDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{record.checkInTime ? formatTime(record.checkInTime) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="border-t border-border p-4">
              <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      )}
    </Container>
  )
}
