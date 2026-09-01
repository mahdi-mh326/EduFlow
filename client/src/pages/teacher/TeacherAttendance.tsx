import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, Container, Select, ConfirmDialog } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import {
  AlertCircleIcon,
  SendIcon,
} from '@/components/ui/icons'
import type { TeacherLiveSession, TeacherStartAttendanceResponse, TeacherAttendanceRecord, AttendanceStatus } from '@/types/teacher'

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

const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
]

export function TeacherAttendance() {
  const [sessions, setSessions] = useState<TeacherLiveSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [attendanceSession, setAttendanceSession] = useState<TeacherStartAttendanceResponse | null>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)

  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedRecords, setSubmittedRecords] = useState<TeacherAttendanceRecord[]>([])

  const [editingRecord, setEditingRecord] = useState<TeacherAttendanceRecord | null>(null)
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present')

  const loadSessions = async () => {
    setLoadingSessions(true)
    setSessionsError(null)
    try {
      const data = await teacherApi.fetchLiveSessions()
      setSessions(data)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load live sessions. Please try again.'
      setSessionsError(message)
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const eligibleSessions = useMemo(() => {
    return sessions.filter((s) => s.status === 'live' || s.status === 'completed')
  }, [sessions])

  const handleStartAttendance = async () => {
    if (!selectedSessionId) return
    setLoadingAttendance(true)
    setAttendanceError(null)
    setStudentStatuses({})
    setSubmittedRecords([])
    try {
      const data = await teacherApi.startAttendance(selectedSessionId)
      setAttendanceSession(data)
      const initial: Record<string, AttendanceStatus> = {}
      data.students.forEach((s) => {
        initial[s._id] = 'present'
      })
      setStudentStatuses(initial)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to start attendance. Please try again.'
      setAttendanceError(message)
      setAttendanceSession(null)
    } finally {
      setLoadingAttendance(false)
    }
  }

  const handleSubmitAttendance = async () => {
    if (!attendanceSession || !selectedSessionId) return
    setSubmitting(true)
    try {
      const payload = {
        liveSessionId: selectedSessionId,
        students: attendanceSession.students.map((s) => ({
          studentId: s._id,
          status: studentStatuses[s._id] || 'present',
        })),
      }
      const records = await teacherApi.submitAttendance(payload)
      setSubmittedRecords(records)
      toast.success('Attendance submitted successfully')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to submit attendance. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateAttendance = async () => {
    if (!editingRecord) return
    try {
      const updated = await teacherApi.updateAttendance(editingRecord._id, {
        status: editStatus,
      })
      setSubmittedRecords((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      )
      setEditingRecord(null)
      toast.success('Attendance updated successfully')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update attendance. Please try again.'
      toast.error(message)
    }
  }

  if (loadingSessions) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1.25rem" width="250px" className="mb-3" />
              <Skeleton variant="rect" height="40px" width="200px" />
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (sessionsError) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Attendance</h1>
          <p className="mt-1 text-sm text-text-muted">Manage attendance for your live sessions.</p>
        </div>
        <ErrorState title="Unable to load sessions" message={sessionsError} onRetry={loadSessions} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Attendance</h1>
        <p className="mt-1 text-sm text-text-muted">Manage attendance for your live sessions.</p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text mb-3">Select Live Session</h2>
        <p className="text-xs text-text-muted mb-3">
          Choose a live or completed session to manage attendance.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value)
                setAttendanceSession(null)
                setStudentStatuses({})
                setSubmittedRecords([])
                setAttendanceError(null)
              }}
              options={[
                { value: '', label: 'Select a session...' },
                ...eligibleSessions.map((s) => ({
                  value: s._id,
                  label: `${s.title} (${formatDate(s.scheduledDate)} ${formatTime(s.startTime)})`,
                })),
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleStartAttendance}
            disabled={!selectedSessionId || loadingAttendance}
          >
            {loadingAttendance ? 'Loading...' : 'Start Attendance'}
          </Button>
        </div>
      </div>

      {attendanceError && (
        <div className="mb-6">
          <ErrorState title="Unable to load attendance" message={attendanceError} onRetry={handleStartAttendance} />
        </div>
      )}

      {attendanceSession && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-text">{attendanceSession.liveSession.title}</h2>
                <p className="text-xs text-text-muted mt-1">
                  {formatDate(attendanceSession.liveSession.scheduledDate)} • {formatTime(attendanceSession.liveSession.startTime)} – {formatTime(attendanceSession.liveSession.endTime)}
                </p>
              </div>
              <Badge variant="default">Total Students: {attendanceSession.totalStudents}</Badge>
            </div>

            {submittedRecords.length === 0 ? (
              <>
                <div className="rounded-xl border border-border bg-background overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-background">
                        <tr>
                          <th className="px-4 py-3 text-xs font-medium text-text-muted">Student</th>
                          <th className="px-4 py-3 text-xs font-medium text-text-muted">Email</th>
                          <th className="px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {attendanceSession.students.map((student) => (
                          <tr key={student._id} className="hover:bg-background transition-colors duration-150">
                            <td className="px-4 py-3">
                              <span className="font-medium text-text">{student.fullName}</span>
                            </td>
                            <td className="px-4 py-3 text-text-muted">{student.email}</td>
                            <td className="px-4 py-3">
                              <Select
                                value={studentStatuses[student._id] || 'present'}
                                onChange={(e) =>
                                  setStudentStatuses((prev) => ({
                                    ...prev,
                                    [student._id]: e.target.value as AttendanceStatus,
                                  }))
                                }
                                options={ATTENDANCE_STATUSES}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="primary" onClick={handleSubmitAttendance} disabled={submitting}>
                    <SendIcon className="h-4 w-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Attendance'}
                  </Button>
                  <Button variant="outline" onClick={() => setStudentStatuses(() => {
                    const initial: Record<string, AttendanceStatus> = {}
                    attendanceSession.students.forEach((s) => { initial[s._id] = 'present' })
                    return initial
                  })}>
                    Mark All Present
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-background">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium text-text-muted">Student</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-muted">Email</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {submittedRecords.map((record) => {
                        const student = attendanceSession.students.find((s) => s._id === record.studentId)
                        const statusBadge = getStatusBadge(record.status)
                        return (
                          <tr key={record._id} className="hover:bg-background transition-colors duration-150">
                            <td className="px-4 py-3">
                              <span className="font-medium text-text">{student?.fullName || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-3 text-text-muted">{student?.email || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingRecord(record)
                                setEditStatus(record.status as AttendanceStatus)
                              }}>
                                Edit
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!attendanceSession && submittedRecords.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-text">Attendance History</h3>
              <p className="text-xs text-text-muted mt-1">
                Full attendance history and reports are only available to administrators.
                Teachers can start, submit, and update attendance for individual sessions using the controls above.
              </p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onConfirm={handleUpdateAttendance}
        title="Update Attendance"
        message={`Update attendance status for this student?`}
        confirmLabel="Update"
        variant="default"
        secondaryAction={
          <div className="mt-4">
            <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
            <Select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
              options={ATTENDANCE_STATUSES}
            />
          </div>
        }
      />
    </Container>
  )
}
