import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  InboxIcon,
} from '@/components/ui/icons'
import type { TeacherLiveSession } from '@/types/teacher'

type Tab = 'live' | 'upcoming' | 'completed'

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

function getDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const start = sh * 60 + sm
  const end = eh * 60 + em
  const diff = Math.max(0, end - start)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getSessionStatus(session: TeacherLiveSession): { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'neutral' } {
  switch (session.status) {
    case 'live':
      return { label: 'Live', variant: 'success' }
    case 'scheduled':
      return { label: 'Upcoming', variant: 'warning' }
    case 'completed':
      return { label: 'Completed', variant: 'neutral' }
    case 'cancelled':
      return { label: 'Cancelled', variant: 'error' }
    default:
      return { label: session.status, variant: 'default' }
  }
}

function isSessionLiveNow(session: TeacherLiveSession): boolean {
  return session.status === 'live'
}


const tabs: { key: Tab; label: string }[] = [
  { key: 'live', label: 'Live Now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
]

export function TeacherLiveClasses() {
  const [sessions, setSessions] = useState<TeacherLiveSession[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('live')
  const [startingId, setStartingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<TeacherLiveSession | null>(null)
  const [savingSession, setSavingSession] = useState(false)

  const [formData, setFormData] = useState({
    courseId: '',
    classId: '',
    title: '',
    description: '',
    scheduledDate: '',
    startTime: '10:00',
    endTime: '11:30',
  })

  const loadSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sessionsData, classesData] = await Promise.all([
        teacherApi.fetchLiveSessions(),
        teacherApi.getClasses({ limit: 100 }),
      ])
      setSessions(sessionsData)
      setClasses(classesData.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load live classes. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const openCreateModal = () => {
    setEditingSession(null)
    setFormData({
      courseId: classes[0]?.courseId?._id || '',
      classId: classes[0]?._id || '',
      title: '',
      description: '',
      scheduledDate: new Date().toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '11:30',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (session: TeacherLiveSession) => {
    setEditingSession(session)
    setFormData({
      courseId: session.courseId?._id || '',
      classId: session.classId?._id || '',
      title: session.title || '',
      description: session.description || '',
      scheduledDate: session.scheduledDate ? new Date(session.scheduledDate).toISOString().slice(0, 10) : '',
      startTime: session.startTime || '10:00',
      endTime: session.endTime || '11:30',
    })
    setIsModalOpen(true)
  }

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.classId || !formData.courseId || !formData.title.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    const selectedClass = classes.find((c) => c._id === formData.classId)
    const teacherId = selectedClass?.teacherId?._id || selectedClass?.teacherId

    setSavingSession(true)
    try {
      if (editingSession) {
        await teacherApi.updateLiveSession(editingSession._id, {
          courseId: formData.courseId,
          classId: formData.classId,
          title: formData.title,
          description: formData.description,
          scheduledDate: formData.scheduledDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
        })
        toast.success('Live class updated successfully')
      } else {
        await teacherApi.createLiveSession({
          courseId: formData.courseId,
          classId: formData.classId,
          teacherId,
          title: formData.title,
          description: formData.description,
          scheduledDate: formData.scheduledDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
        })
        toast.success('Live class scheduled successfully')
      }
      setIsModalOpen(false)
      await loadSessions()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save live session.'
      toast.error(message)
    } finally {
      setSavingSession(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel/delete this live session?')) return
    setDeletingId(sessionId)
    try {
      await teacherApi.deleteLiveSession(sessionId)
      toast.success('Live session deleted')
      setSessions((prev) => prev.filter((s) => s._id !== sessionId))
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete live session.'
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }


  const filteredSessions = useMemo(() => {
    if (activeTab === 'live') {
      return sessions.filter((s) => isSessionLiveNow(s) || s.status === 'live')
    }
    if (activeTab === 'upcoming') {
      return sessions.filter((s) => s.status === 'scheduled' && !isSessionLiveNow(s))
    }
    if (activeTab === 'completed') {
      return sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled')
    }
    return sessions
  }, [sessions, activeTab])

  const tabCounts = useMemo(() => {
    const live = sessions.filter((s) => isSessionLiveNow(s) || s.status === 'live').length
    const upcoming = sessions.filter((s) => s.status === 'scheduled' && !isSessionLiveNow(s)).length
    const completed = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled').length
    return { live, upcoming, completed }
  }, [sessions])

  const handleStartSession = async (session: TeacherLiveSession) => {
    if (session.status !== 'scheduled') return
    setStartingId(session._id)
    try {
      await teacherApi.startLiveSession(session._id)
      toast.success('Live session started successfully')
      await loadSessions()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to start live session.'
      toast.error(message)
    } finally {
      setStartingId(null)
    }
  }

  const handleEndSession = async (session: TeacherLiveSession) => {
    if (session.status !== 'live') return
    setStartingId(session._id)
    try {
      await teacherApi.endLiveSession(session._id)
      toast.success('Live session ended successfully')
      await loadSessions()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to end live session.'
      toast.error(message)
    } finally {
      setStartingId(null)
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton variant="text" height="1.25rem" width="250px" />
                  <Skeleton variant="text" height="0.875rem" width="180px" />
                  <Skeleton variant="text" height="0.875rem" width="300px" />
                </div>
                <Skeleton variant="rect" height="2rem" width="100px" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Live Classes</h1>
          <p className="mt-1 text-sm text-text-muted">Manage your live sessions and classrooms.</p>
        </div>
        <ErrorState title="Unable to load live classes" message={error} onRetry={loadSessions} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Live Classes</h1>
          <p className="mt-1 text-sm text-text-muted">Manage and schedule your live sessions and classrooms.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Schedule Live Class
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted hover:bg-background border border-border'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-background text-text-muted'
              }`}
            >
              {tab.key === 'live' ? tabCounts.live : tab.key === 'upcoming' ? tabCounts.upcoming : tabCounts.completed}
            </span>
          </button>
        ))}
      </div>

      {filteredSessions.length === 0 ? (
        <EmptyState
          title={`No ${activeTab === 'live' ? 'live' : activeTab === 'upcoming' ? 'upcoming' : 'completed'} classes`}
          description={
            activeTab === 'live'
              ? 'There are no live classes right now. Check the upcoming tab for scheduled sessions.'
              : activeTab === 'upcoming'
              ? 'No upcoming live classes are scheduled yet.'
              : 'No completed live classes yet.'
          }
          icon={<InboxIcon className="h-12 w-12" />}
          action={
            activeTab === 'upcoming' ? (
              <Button variant="primary" size="sm" onClick={openCreateModal}>
                Schedule a Class
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const course = session.courseId
            const cls = session.classId
            const statusBadge = getSessionStatus(session)
            const duration = getDuration(session.startTime, session.endTime)

            return (
              <div
                key={session._id}
                className="rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-text">{session.title}</h3>
                      <Badge variant={statusBadge.variant} className="capitalize">{statusBadge.label}</Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <BookOpenIcon className="h-3.5 w-3.5" />
                        {course?.title || 'Course N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3.5 w-3.5" />
                        {cls?.batchName || 'Class N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {formatTime(session.startTime)} – {formatTime(session.endTime)} ({duration})
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span>
                        Date:{' '}
                        <span className="font-medium text-text">{formatDate(session.scheduledDate)}</span>
                      </span>
                      <span>
                        Meeting:{' '}
                        <span className="font-medium text-text">{session.meetingUrl ? 'Available' : 'N/A'}</span>
                      </span>
                    </div>

                    {session.description && (
                      <p className="mt-2 text-xs text-text-muted line-clamp-2">{session.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    {session.status === 'live' && (
                      <>
                        <Link to={`/teacher/live-classes/${session._id}/classroom`}>
                          <Button variant="primary" size="sm">
                            Join Classroom
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleEndSession(session)}
                          disabled={startingId === session._id}
                        >
                          {startingId === session._id ? 'Ending...' : 'End Session'}
                        </Button>
                      </>
                    )}
                    {session.status === 'scheduled' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartSession(session)}
                            disabled={startingId === session._id}
                          >
                            {startingId === session._id ? 'Starting...' : 'Start Class'}
                          </Button>
                          <Link to={`/teacher/live-classes/${session._id}/classroom`}>
                            <Button variant="outline" size="sm">
                              Preview
                            </Button>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(session)}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteSession(session._id)}
                            disabled={deletingId === session._id}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                    {(session.status === 'completed' || session.status === 'cancelled') && (
                      <Link to={`/teacher/live-classes/${session._id}/classroom`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Schedule Live Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text mb-4">
              {editingSession ? 'Edit Live Class' : 'Schedule Live Class'}
            </h3>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Class / Batch *
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => {
                    const cId = e.target.value
                    const selected = classes.find((c) => c._id === cId)
                    setFormData({
                      ...formData,
                      classId: cId,
                      courseId: selected?.courseId?._id || selected?.courseId || formData.courseId,
                    })
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.batchName} ({cls.courseId?.title || 'Course'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Introduction to React State Management"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What topics will be covered in this session?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={savingSession}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={savingSession}
                >
                  {editingSession ? 'Update Session' : 'Schedule Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  )
}

