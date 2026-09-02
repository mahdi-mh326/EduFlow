import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { adminApi } from '@/services/api/admin'
import { getAvatarUrl } from '@/utils'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  SearchIcon,
  MonitorIcon,
  CalendarIcon,
  TrashIcon,
} from '@/components/ui/icons'

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

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'neutral' | 'error' | 'default' {
  switch (status) {
    case 'live':
      return 'success'
    case 'scheduled':
      return 'warning'
    case 'completed':
      return 'neutral'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

type TabType = 'all' | 'live' | 'completed'

export function AdminLiveSessions() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('live')
  const [actionSessionId, setActionSessionId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getLiveSessions({ limit: 100 })
      setSessions(res.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load live sessions.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleEndSession = async (id: string) => {
    setActionSessionId(id)
    try {
      await adminApi.endLiveSession(id)
      toast.success('Live session terminated')
      await loadData()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to end session.'
      toast.error(message)
    } finally {
      setActionSessionId(null)
    }
  }

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live session record?')) return
    setActionSessionId(id)
    try {
      await adminApi.deleteLiveSession(id)
      toast.success('Record deleted')
      setSessions((prev) => prev.filter((s) => s._id !== id))
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete session.'
      toast.error(message)
    } finally {
      setActionSessionId(null)
    }
  }

  const liveCount = useMemo(() => sessions.filter((s) => s.status === 'live').length, [sessions])
  const completedCount = useMemo(() => sessions.filter((s) => s.status === 'completed').length, [sessions])

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.courseId?.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.classId?.batchName?.toLowerCase().includes(search.toLowerCase()) ||
        s.teacherId?.fullName?.toLowerCase().includes(search.toLowerCase())

      let matchesTab = true
      if (activeTab === 'live') matchesTab = s.status === 'live'
      if (activeTab === 'completed') matchesTab = s.status === 'completed'

      return matchesSearch && matchesTab
    })
  }, [sessions, search, activeTab])

  if (loading && sessions.length === 0) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="250px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="90px" className="rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="100px" className="rounded-xl" />
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Live Classes Monitoring</h1>
          <p className="mt-1 text-sm text-text-muted">Observe active broadcasts and visit ongoing live classes.</p>
        </div>
        <ErrorState title="Unable to load live sessions" message={error} onRetry={loadData} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Live Classes Monitoring</h1>
          <p className="mt-1 text-sm text-text-muted">
            Monitor real-time teacher broadcasts, visit active classes to inspect teaching sessions, and view history.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="self-start sm:self-auto gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Refresh Live Status
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div
          onClick={() => setActiveTab('live')}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            activeTab === 'live'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
              : 'border-border bg-surface hover:border-border/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Live Now (Active)</p>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-3xl font-bold text-text mt-2">{liveCount}</p>
          <p className="text-xs text-text-muted mt-1">Ongoing sessions you can join & visit</p>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            activeTab === 'completed'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border bg-surface hover:border-border/80'
          }`}
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Completed Sessions</p>
          <p className="text-3xl font-bold text-text mt-2">{completedCount}</p>
          <p className="text-xs text-text-muted mt-1">Past completed live classes</p>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            activeTab === 'all'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border bg-surface hover:border-border/80'
          }`}
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Broadcasts</p>
          <p className="text-3xl font-bold text-text mt-2">{sessions.length}</p>
          <p className="text-xs text-text-muted mt-1">All recorded class sessions</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1">
          {[
            { key: 'live', label: `🔴 Live Now (${liveCount})` },
            { key: 'completed', label: `Completed (${completedCount})` },
            { key: 'all', label: `All (${sessions.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabType)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === t.key
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search class, course, or teacher..."
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs sm:text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          title={activeTab === 'live' ? 'No live classes currently active' : 'No sessions found'}
          description={
            activeTab === 'live'
              ? 'When teachers start a live class, it will appear here immediately for observation.'
              : 'No live class records match your search filter.'
          }
          icon={<MonitorIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const isLive = session.status === 'live'
            const teacher = session.teacherId


            return (
              <div
                key={session._id}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-5 transition-all ${
                  isLive
                    ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 via-surface to-surface shadow-sm'
                    : 'border-border bg-surface'
                }`}
              >
                {/* Left Info */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-text">{session.title}</h3>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/20 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Live Now
                      </span>
                    ) : (
                      <Badge variant={getStatusBadgeVariant(session.status)} className="capitalize text-xs">
                        {session.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1.5 font-medium text-text">
                      <BookOpenIcon className="h-4 w-4 text-primary" />
                      {session.courseId?.title || 'Course'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <UsersIcon className="h-4 w-4 text-primary" />
                      {session.classId?.batchName || 'Class'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      {formatDate(session.scheduledDate || session.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4 text-primary" />
                      {formatTime(session.startTime)} – {formatTime(session.endTime)}
                    </span>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] overflow-hidden">
                      {teacher?.avatar ? (
                        <img src={getAvatarUrl(teacher.avatar)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        teacher?.fullName?.charAt(0).toUpperCase() || 'T'
                      )}
                    </div>
                    <span className="text-xs font-semibold text-text">
                      Instructor: {teacher?.fullName || 'N/A'}
                    </span>
                    <span className="text-xs text-text-muted">({teacher?.email || 'N/A'})</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                  {isLive && (
                    <>
                      <Link to={`/teacher/live-classes/${session._id}/classroom`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 font-bold"
                        >
                          <MonitorIcon className="h-4 w-4" />
                          Join & Visit Class ↗
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-error border-error/30 hover:bg-error/10"
                        onClick={() => handleEndSession(session._id)}
                        disabled={actionSessionId === session._id}
                      >
                        End Class
                      </Button>
                    </>
                  )}

                  {!isLive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-text-muted hover:text-error hover:border-error/30"
                      onClick={() => handleDeleteSession(session._id)}
                      disabled={actionSessionId === session._id}
                      title="Delete Record"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
