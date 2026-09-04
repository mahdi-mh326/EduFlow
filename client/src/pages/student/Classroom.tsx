import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, Container } from '@/components'
import { studentApi } from '@/services/api/student'
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
import type { StudentLiveSession } from '@/types/student'

function formatTime(time?: string) {
  if (!time || typeof time !== 'string') return 'N/A'
  const parts = time.split(':')
  if (parts.length < 2) return time
  const [hours, minutes] = parts.map(Number)
  if (isNaN(hours) || isNaN(minutes)) return time
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${(minutes || 0).toString().padStart(2, '0')} ${period}`
}

function getDuration(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime || typeof startTime !== 'string' || typeof endTime !== 'string') return 'N/A'
  const sParts = startTime.split(':')
  const eParts = endTime.split(':')
  if (sParts.length < 2 || eParts.length < 2) return 'N/A'
  const [sh, sm] = sParts.map(Number)
  const [eh, em] = eParts.map(Number)
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 'N/A'
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


export function Classroom() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<StudentLiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat')
  const [showSidePanel, setShowSidePanel] = useState(true)
  const { user, accessToken } = useAuthStore()
  const currentUserId = user?.id || (user as any)?._id || ''

  const {
    connectionState,
    participants,
    chatMessages,
    localStream,
    remoteStreams,
    isVideoOn,
    isAudioOn,
    isHandRaised,
    hasJoined,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleHandRaise,
    sendChatMessage,
  } = useClassroomSocket({
    sessionId: sessionId || '',
    accessToken: accessToken || undefined,
    currentUserId,
    currentUserName: user?.fullName,
    onRoomJoined: () => {
      setJoinError(null)
      toast.success('Joined live class successfully!')
    },
    onClassEnded: (payload) => {
      toast.error(payload?.message || 'The instructor has ended the live class.')
      navigate('/student/classes')
    },
    onError: (err) => {
      setJoinError(err.message || 'Failed to join classroom.')
      toast.error(err.message || 'Failed to join classroom.')
    },
  })

  const otherParticipants = useMemo(() => {

    const map = new Map<string, (typeof participants)[0]>()
    for (const p of participants) {
      if (p.userId && p.userId !== currentUserId) {
        map.set(p.userId, p)
      }
    }
    return Array.from(map.values())
  }, [participants, currentUserId])

  const teacherParticipant = useMemo(() => {
    return participants.find((p) => p.role === 'teacher' && p.userId !== currentUserId)
  }, [participants, currentUserId])

  useEffect(() => {

    if (!sessionId) return
    setLoading(true)
    setError(null)
    setJoinError(null)

    studentApi
      .getLiveSessionById(sessionId)
      .then((sess) => {
        if (sess) {
          setSession(sess)
        } else {
          setError('This live session was not found or is no longer available.')
        }
      })
      .catch(() => {
        // Fallback to getLiveSessions list
        studentApi
          .getLiveSessions()
          .then((sessions) => {
            const found = sessions.find((s) => s._id === sessionId)
            if (found) {
              setSession(found)
            } else {
              setError('This live session was not found or is no longer available.')
            }
          })
          .catch((err: any) => {
            const message = err?.response?.data?.message || 'Unable to load this live session.'
            setError(message)
          })
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
    navigate('/student/classes')
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
            onClick={() => navigate('/student/classes')}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Live Classes
          </button>
        </div>
        <ErrorState
          title="Unable to load live session"
          message={error || 'This session was not found.'}
          onRetry={() => navigate('/student/classes')}
          secondaryAction={
            <Button variant="outline" onClick={() => navigate('/student/classes')}>
              View Live Classes
            </Button>
          }
        />
      </Container>
    )
  }

  const course = session.courseId
  const cls = session.classId
  const teacher = session.teacherId
  const isLive = session.status === 'live' || connectionState === 'connected'
  const connectionInfo = connectionStateConfig[connectionState] || connectionStateConfig.connecting


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      {/* Header Bar */}
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
                <Badge variant={isLive ? 'success' : 'warning'} className="capitalize text-xs">
                  {isLive ? '● Live' : session.status}
                </Badge>
              </div>
              <p className="text-xs text-text-muted">
                {course?.title} • {cls?.batchName} • Instructor: {teacher?.fullName || 'TBD'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`hidden sm:flex items-center gap-1 text-xs font-medium ${connectionInfo.color}`}>
              {connectionInfo.icon}
              {connectionInfo.label}
            </span>

            {hasJoined && (
              <Button variant="danger" size="sm" onClick={handleLeave}>
                Leave Class
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Classroom Body */}
      <div className="flex-1 p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-[1600px] mx-auto w-full">
        {/* Video Stage Area */}
        <div className={`flex flex-col justify-between ${showSidePanel ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {!hasJoined ? (
            /* Pre-join screen */
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center shadow-sm min-h-[400px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <MonitorIcon className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-text">Join Live Class</h2>
              <p className="mt-2 text-sm text-text-muted max-w-md">
                {session.status === 'live'
                  ? 'Your instructor is currently live. Click below to enter the classroom.'
                  : 'This class has not started yet. You will be able to enter as soon as the teacher goes live.'}
              </p>

              <div className="mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleJoin}
                  disabled={connectionState === 'connecting'}
                >
                  {connectionState === 'connecting'
                    ? 'Connecting...'
                    : session.status === 'live'
                      ? 'Join Live Class'
                      : 'Join Class (Waiting for Teacher)'}
                </Button>
              </div>

              {joinError && <p className="mt-4 text-xs text-error">{joinError}</p>}
            </div>
          ) : (
            /* Live Call Grid */
            <div className="flex flex-col gap-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 flex-1 min-h-[420px]">
                {/* Teacher's Video (or remote participants) */}
                {teacherParticipant && (
                  <VideoTile
                    stream={remoteStreams[teacherParticipant.userId]}
                    displayName={teacherParticipant.displayName}
                    role="teacher"
                    isVideoOn={teacherParticipant.isVideoOn}
                    isAudioOn={teacherParticipant.isAudioOn}
                    isScreenSharing={teacherParticipant.isScreenSharing}
                    className="min-h-[220px] ring-2 ring-primary/40"
                  />
                )}

                {/* Local Video Tile (Student) */}
                <VideoTile
                  stream={localStream}
                  displayName={user?.fullName || 'You'}
                  role="student"
                  isLocal
                  isVideoOn={isVideoOn}
                  isAudioOn={isAudioOn}
                  isHandRaised={isHandRaised}
                  className="min-h-[220px]"
                />

                {/* Other Student Peers */}
                {otherParticipants
                  .filter((p) => p.role !== 'teacher')
                  .map((p) => {
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

              {/* Control Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-lg">
                {/* Mic */}
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

                {/* Camera */}
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

                {/* Raise Hand */}
                <button
                  type="button"
                  onClick={toggleHandRaise}
                  className={`flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-all ${
                    isHandRaised
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-background border border-border text-text hover:bg-surface'
                  }`}
                  title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                >
                  <span>✋</span>
                  <span>{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>

                {/* Toggle Chat */}
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

                {/* Leave Class */}
                <Button variant="danger" size="sm" onClick={handleLeave}>
                  Leave Room
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel (Chat & Participants) */}
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
                Participants ({participants.length})
              </button>
            </div>

            {activeTab === 'chat' ? (
              <ClassroomChat
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="flex-1 rounded-2xl border border-border bg-surface p-4 shadow-sm overflow-y-auto max-h-[500px]">
                <h3 className="text-xs font-bold text-text mb-3 uppercase tracking-wider">
                  Participants ({participants.length})
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
                            {p.displayName} {p.userId === currentUserId ? '(You)' : ''}
                          </p>
                          <span className="text-[10px] text-text-muted capitalize">{p.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {p.isHandRaised && <span title="Hand Raised">✋</span>}
                        {p.isVideoOn ? <span title="Camera On">📹</span> : <span title="Camera Off">🚫</span>}
                        {p.isAudioOn ? <span title="Mic On">🎙️</span> : <span title="Mic Muted">🔇</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Class Info */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Instructor</span>
                <span className="font-medium text-text">{teacher?.fullName || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Class Time</span>
                <span className="font-medium text-text">{formatTime(session.startTime)} – {formatTime(session.endTime)}</span>
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
