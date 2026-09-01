import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, Container } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import { useClassroomSocket } from '@/hooks/useClassroomSocket'
import { useAuthStore } from '@/stores/auth.store'
import { VideoTile, ClassroomChat } from '@/components/classroom'
import {
  MonitorIcon,
  ChevronLeftIcon,
  AlertCircleIcon,
  SpinnerIcon,
  MessageSquareIcon,
} from '@/components/ui/icons'

import type { TeacherLiveSession } from '@/types/teacher'

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

const connectionStateConfig = {
  connecting: { label: 'Connecting...', icon: <SpinnerIcon className="h-4 w-4 animate-spin" />, color: 'text-text-muted' },
  connected: { label: 'Connected', icon: <MonitorIcon className="h-4 w-4 text-success" />, color: 'text-success' },
  disconnected: { label: 'Disconnected', icon: <AlertCircleIcon className="h-4 w-4 text-error" />, color: 'text-error' },
  error: { label: 'Connection Error', icon: <AlertCircleIcon className="h-4 w-4 text-error" />, color: 'text-error' },
}

export function TeacherClassroom() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<TeacherLiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat')
  const [showSidePanel, setShowSidePanel] = useState(true)
  const { user, accessToken } = useAuthStore()

  const {
    connectionState,
    participants,
    chatMessages,
    localStream,
    remoteStreams,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    hasJoined,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    lowerParticipantHand,
    sendChatMessage,
  } = useClassroomSocket({

    sessionId: sessionId || '',
    accessToken: accessToken || undefined,
    currentUserId: user?.id,
    currentUserName: user?.fullName,
    onRoomJoined: () => {
      setJoinError(null)
      toast.success('Joined live classroom successfully!')
    },
    onError: (err) => {
      setJoinError(err.message || 'Classroom error.')
      toast.error(err.message || 'Classroom error.')
    },
  })

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    setJoinError(null)

    teacherApi
      .getLiveSessionById(sessionId)
      .then((s) => setSession(s))
      .catch((err: any) => {
        const message = err?.response?.data?.message || 'Unable to load this live session.'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    return () => {
      leaveRoom()
    }
  }, [leaveRoom])

  const handleJoin = () => {
    setJoinError(null)
    joinRoom()
  }

  const handleLeave = () => {
    leaveRoom()
    navigate('/teacher/live-classes')
  }

  const handleStart = async () => {
    if (!session || session.status !== 'scheduled') return
    setStarting(true)
    try {
      await teacherApi.startLiveSession(session._id)
      toast.success('Live session started! You can now take the class.')
      setSession((prev) => (prev ? { ...prev, status: 'live' } : null))
      // Auto-join after starting
      joinRoom()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to start live session.'
      toast.error(message)
    } finally {
      setStarting(false)
    }
  }

  const handleEnd = async () => {
    if (!session || session.status !== 'live') return
    if (!confirm('Are you sure you want to end this live class for all students?')) return
    setEnding(true)
    try {
      await teacherApi.endLiveSession(session._id)
      toast.success('Live session ended successfully.')
      setSession((prev) => (prev ? { ...prev, status: 'completed' } : null))
      leaveRoom()
      navigate('/teacher/live-classes')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to end live session.'
      toast.error(message)
    } finally {
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="mb-4">
          <Skeleton variant="text" height="1rem" width="150px" className="mb-2" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="text" height="2rem" width="350px" />
          <Skeleton variant="text" height="1rem" width="500px" />
          <div className="rounded-xl border border-border bg-surface p-6">
            <Skeleton variant="rect" height="400px" width="100%" />
          </div>
        </div>
      </Container>
    )
  }

  if (error || !session) {
    return (
      <Container className="py-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/teacher/live-classes')}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Live Classes
          </button>
        </div>
        <ErrorState
          title="Unable to load live session"
          message={error || 'This session was not found.'}
          onRetry={() => navigate('/teacher/live-classes')}
          secondaryAction={
            <Button variant="outline" onClick={() => navigate('/teacher/live-classes')}>
              View Live Classes
            </Button>
          }
        />
      </Container>
    )
  }

  const course = session.courseId
  const cls = session.classId
  const isLive = session.status === 'live' || connectionState === 'connected'

  const connectionInfo = connectionStateConfig[connectionState]

  const otherParticipants = participants.filter((p) => p.userId !== user?.id)
  const raisedHands = participants.filter((p) => p.isHandRaised)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      {/* Header bar */}
      <div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLeave}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text hover:bg-surface"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Exit Class
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-text truncate max-w-[280px] sm:max-w-md">
                  {session.title}
                </h1>
                <Badge
                  variant={isLive ? 'success' : session.status === 'scheduled' ? 'warning' : 'default'}
                  className="capitalize text-xs"
                >
                  {isLive ? '● Live' : session.status}
                </Badge>
              </div>
              <p className="text-xs text-text-muted">
                {course?.title} • {cls?.batchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`hidden sm:flex items-center gap-1 text-xs font-medium ${connectionInfo.color}`}>
              {connectionInfo.icon}
              {connectionInfo.label}
            </span>

            {session.status === 'scheduled' && (
              <Button variant="primary" size="sm" onClick={handleStart} loading={starting}>
                Start Live Session
              </Button>
            )}

            {session.status === 'live' && (
              <Button variant="danger" size="sm" onClick={handleEnd} loading={ending}>
                End Class
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hand Raised Notification Banner */}
      {raisedHands.length > 0 && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-700 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base animate-bounce">✋</span>
            <span>
              <strong>{raisedHands.map((h) => h.displayName).join(', ')}</strong> raised {raisedHands.length > 1 ? 'their hands' : 'hand'} with a question!
            </span>
          </div>
          <div className="flex items-center gap-2">
            {raisedHands.map((h) => (
              <button
                key={h.userId}
                type="button"
                onClick={() => lowerParticipantHand(h.userId)}
                className="rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-amber-600 transition-all cursor-pointer"
              >
                Lower {h.displayName.split(' ')[0]}'s Hand
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Main Classroom Body */}
      <div className="flex-1 p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-[1600px] mx-auto w-full">
        {/* Video Stage Area (3 cols) */}
        <div className={`flex flex-col justify-between ${showSidePanel ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {!hasJoined ? (
            /* Pre-join screen */
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center shadow-sm min-h-[400px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <MonitorIcon className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-text">Live Classroom Ready</h2>
              <p className="mt-2 text-sm text-text-muted max-w-md">
                {session.status === 'live'
                  ? 'Your live class is active. Turn on your camera and microphone to take class.'
                  : 'Start your class to begin live video and audio streaming with students.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {session.status === 'scheduled' ? (
                  <Button variant="primary" size="lg" onClick={handleStart} loading={starting}>
                    Start & Join Class
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" onClick={handleJoin}>
                    Enter Live Class
                  </Button>
                )}
              </div>
              {joinError && <p className="mt-4 text-xs text-error">{joinError}</p>}
            </div>
          ) : (
            /* Live Call Grid */
            <div className="flex flex-col gap-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 flex-1 min-h-[420px]">
                {/* Local Video Tile (Teacher) */}
                <VideoTile
                  stream={localStream}
                  displayName={user?.fullName || 'Teacher'}
                  role="teacher"
                  isLocal
                  isVideoOn={isVideoOn}
                  isAudioOn={isAudioOn}
                  isScreenSharing={isScreenSharing}
                  className="min-h-[220px]"
                />

                {/* Remote Participants Video Tiles */}
                {otherParticipants.map((p) => {
                  const remoteStream = remoteStreams[p.userId]
                  return (
                    <VideoTile
                      key={p.userId}
                      stream={remoteStream}
                      displayName={p.displayName}
                      role={p.role}
                      isVideoOn={p.isVideoOn}
                      isAudioOn={p.isAudioOn}
                      isScreenSharing={p.isScreenSharing}
                      isHandRaised={p.isHandRaised}
                      className="min-h-[220px]"
                    />
                  )
                })}
              </div>

              {/* In-Call Controls Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-lg">
                {/* Microphone Toggle */}
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
                    isAudioOn
                      ? 'bg-background border border-border text-text hover:bg-surface'
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20'
                  }`}
                  title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isAudioOn ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="2" x2="22" y1="2" y2="22" />
                      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                      <path d="M5 10v2a7 7 0 0 0 12 5" />
                      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  )}
                </button>

                {/* Camera Toggle */}
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
                    isVideoOn
                      ? 'bg-background border border-border text-text hover:bg-surface'
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20'
                  }`}
                  title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isVideoOn ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m22 8-6 4 6 4V8Z" />
                      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="2" x2="22" y1="2" y2="22" />
                      <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" />
                      <path d="m22 8-6 4 6 4V8Z" />
                    </svg>
                  )}
                </button>

                {/* Screen Sharing Toggle */}
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-all ${
                    isScreenSharing
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-background border border-border text-text hover:bg-surface'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                  </svg>
                  <span className="hidden sm:inline">
                    {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                  </span>
                </button>

                {/* Toggle Side Panel */}
                <button
                  type="button"
                  onClick={() => setShowSidePanel(!showSidePanel)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-text transition-all ${
                    showSidePanel ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-surface'
                  }`}
                  title="Toggle Chat & Participants"
                >
                  <MessageSquareIcon className="h-5 w-5" />
                </button>

                {/* Leave / End Class */}
                <Button variant="danger" size="sm" onClick={handleLeave}>
                  Leave Room
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel (Chat & Participants - 1 col) */}
        {showSidePanel && (
          <div className="flex flex-col gap-3 lg:col-span-1 min-h-[400px]">
            <div className="flex rounded-xl border border-border bg-surface p-1">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'chat' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text'
                }`}
              >
                Chat ({chatMessages.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('participants')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'participants' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text'
                }`}
              >
                Students ({participants.length})
              </button>
            </div>

            {activeTab === 'chat' ? (
              <ClassroomChat
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                currentUserId={user?.id}
              />
            ) : (
              <div className="flex-1 rounded-2xl border border-border bg-surface p-4 shadow-sm overflow-y-auto max-h-[500px]">
                <h3 className="text-xs font-bold text-text mb-3 uppercase tracking-wider">
                  In This Class ({participants.length})
                </h3>
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {p.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-text">
                            {p.displayName} {p.userId === user?.id ? '(You)' : ''}
                          </p>
                          <span className="text-[10px] text-text-muted capitalize">{p.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {p.isHandRaised && (
                          <button
                            type="button"
                            onClick={() => lowerParticipantHand(p.userId)}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 hover:bg-amber-500/30 transition-colors cursor-pointer"
                            title="Click to lower hand"
                          >
                            <span>✋</span>
                            <span>Lower</span>
                          </button>
                        )}
                        {p.isVideoOn ? <span title="Camera On">📹</span> : <span title="Camera Off">🚫</span>}
                        {p.isAudioOn ? <span title="Mic On">🎙️</span> : <span title="Mic Muted">🔇</span>}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Class Info Card */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Class Time</span>
                <span className="font-medium text-text">{formatTime(session.startTime)} – {formatTime(session.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Date</span>
                <span className="font-medium text-text">{formatDate(session.scheduledDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Duration</span>
                <span className="font-medium text-text">{getDuration(session.startTime, session.endTime)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
