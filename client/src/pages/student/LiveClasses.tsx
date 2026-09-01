import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { studentApi } from '@/services/api/student'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  MonitorIcon,
  InboxIcon,
} from '@/components/ui/icons'
import type { StudentLiveSession } from '@/types/student'

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

function getSessionStatus(session: StudentLiveSession): { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'neutral' } {
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

function isSessionLiveNow(session: StudentLiveSession): boolean {
  return session.status === 'live'
}


const tabs: { key: Tab; label: string }[] = [
  { key: 'live', label: 'Live Now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
]

export function LiveClasses() {
  const [sessions, setSessions] = useState<StudentLiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('live')

  const loadSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await studentApi.getLiveSessions()
      setSessions(data)
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
          <p className="mt-1 text-sm text-text-muted">Join your scheduled live sessions from here.</p>
        </div>
        <ErrorState title="Unable to load live classes" message={error} onRetry={loadSessions} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Live Classes</h1>
        <p className="mt-1 text-sm text-text-muted">Join your scheduled live sessions from here.</p>
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
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const course = session.courseId
            const cls = session.classId
            const teacher = session.teacherId
            const statusBadge = getSessionStatus(session)
            const isLive = isSessionLiveNow(session)
            const canJoin = isLive || session.status === 'live'
            const duration = getDuration(session.startTime, session.endTime)

            return (
              <div
                key={session._id}
                className="rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-1 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MonitorIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">{session.title}</h3>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
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
                          Instructor:{' '}
                          <span className="font-medium text-text">{teacher?.fullName || 'TBD'}</span>
                        </span>
                        <span>
                          Date:{' '}
                          <span className="font-medium text-text">{formatDate(session.scheduledDate)}</span>
                        </span>
                      </div>

                      {session.description && (
                        <p className="mt-2 text-xs text-text-muted line-clamp-2">{session.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    {canJoin ? (
                      <Link to={`/student/classes/${session._id}/classroom`}>
                        <Button variant="primary" size="sm">
                          Join Live Class
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Not Available
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
