import { useEffect, useRef } from 'react'
import { Badge } from '@/components'

interface VideoTileProps {
  stream?: MediaStream | null
  displayName: string
  role?: string
  isLocal?: boolean
  isVideoOn?: boolean
  isAudioOn?: boolean
  isHandRaised?: boolean
  isScreenSharing?: boolean
  className?: string
}

export function VideoTile({
  stream,
  displayName,
  role = 'student',
  isLocal = false,
  isVideoOn = true,
  isAudioOn = true,
  isHandRaised = false,
  isScreenSharing = false,
  className = '',
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [stream])

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-md transition-all ${className}`}
    >
      {/* Video Element or Avatar Placeholder */}
      <div className="relative flex h-full w-full items-center justify-center">
        {stream && isVideoOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`h-full w-full object-cover ${isLocal && !isScreenSharing ? '-scale-x-100' : ''}`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary ring-4 ring-primary/10">
              {initials}
            </div>
            <p className="mt-3 text-sm font-medium text-slate-200">{displayName}</p>
            <span className="text-xs text-slate-400">
              {isVideoOn === false ? 'Camera is off' : 'Connecting video...'}
            </span>
          </div>
        )}

        {/* Hand Raised Badge */}
        {isHandRaised && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm animate-bounce">
            <span>✋ Hand Raised</span>
          </div>
        )}

        {/* Screen Sharing Indicator */}
        {isScreenSharing && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <span>🖥️ Screen Share</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Name, Role, Mic Indicator */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <p className="truncate text-xs font-medium">
            {displayName} {isLocal ? '(You)' : ''}
          </p>
          <Badge
            variant={role === 'teacher' ? 'default' : 'neutral'}
            className="text-[10px] uppercase tracking-wider py-0 px-1.5 bg-white/15 text-white border-none"
          >
            {role}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mic icon status */}
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              isAudioOn ? 'bg-emerald-600/80 text-white' : 'bg-rose-600/90 text-white'
            }`}
            title={isAudioOn ? 'Microphone On' : 'Microphone Muted'}
          >
            {isAudioOn ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="2" x2="22" y1="2" y2="22" />
                <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                <path d="M5 10v2a7 7 0 0 0 12 5" />
                <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
