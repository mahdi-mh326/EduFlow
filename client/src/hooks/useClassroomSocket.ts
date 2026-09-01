import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { env } from '@/config/env'

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface Participant {
  userId: string
  socketId?: string
  role: string
  displayName: string
  isVideoOn?: boolean
  isAudioOn?: boolean
  isScreenSharing?: boolean
  isHandRaised?: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  text: string
  createdAt: string
}

export interface UseClassroomSocketOptions {
  sessionId: string
  accessToken?: string | null
  currentUserId?: string
  currentUserName?: string
  onRoomJoined?: (payload: { roomId: string; sessionId: string; role: string; participants: Participant[] }) => void
  onError?: (error: { message: string; code?: string }) => void
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useClassroomSocket({
  sessionId,
  accessToken,
  currentUserId,
  onRoomJoined,
  onError,
}: UseClassroomSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Local media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)

  // References for WebRTC
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const isVideoOnRef = useRef(isVideoOn)
  const isAudioOnRef = useRef(isAudioOn)
  const isScreenSharingRef = useRef(isScreenSharing)
  const isHandRaisedRef = useRef(isHandRaised)

  const onRoomJoinedRef = useRef(onRoomJoined)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onRoomJoinedRef.current = onRoomJoined
    onErrorRef.current = onError
  }, [onRoomJoined, onError])

  useEffect(() => {
    isVideoOnRef.current = isVideoOn
    isAudioOnRef.current = isAudioOn
    isScreenSharingRef.current = isScreenSharing
    isHandRaisedRef.current = isHandRaised
  }, [isVideoOn, isAudioOn, isScreenSharing, isHandRaised])

  // Helper to create Peer Connection
  const createPeerConnection = useCallback((remoteUserId: string, socket: Socket) => {
    if (peerConnections.current.has(remoteUserId)) {
      return peerConnections.current.get(remoteUserId)!
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Add local tracks if available
    const activeStream = screenStreamRef.current || localStreamRef.current
    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        pc.addTrack(track, activeStream)
      })
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: remoteUserId,
        })
      }
    }

    // Remote Track handler
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0]
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteUserId]: stream,
        }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams((prev) => {
          const next = { ...prev }
          delete next[remoteUserId]
          return next
        })
      }
    }

    peerConnections.current.set(remoteUserId, pc)
    return pc
  }, [])

  // Close and clean peer connections
  const removePeerConnection = useCallback((remoteUserId: string) => {
    const pc = peerConnections.current.get(remoteUserId)
    if (pc) {
      pc.close()
      peerConnections.current.delete(remoteUserId)
    }
    setRemoteStreams((prev) => {
      const next = { ...prev }
      delete next[remoteUserId]
      return next
    })
  }, [])

  // Socket Connection Effect
  useEffect(() => {
    if (!accessToken) {
      setConnectionState('error')
      onErrorRef.current?.({ message: 'Authentication required. Please log in again.', code: 'AUTH_REQUIRED' })
      return
    }

    let socketUrl: string
    try {
      socketUrl = new URL(env.VITE_API_BASE_URL).origin
    } catch {
      setConnectionState('error')
      onErrorRef.current?.({ message: 'The classroom connection is not configured correctly.', code: 'SOCKET_CONFIGURATION_ERROR' })
      return
    }

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionState('connected')
    })

    socket.on('disconnect', () => {
      setConnectionState('disconnected')
    })

    socket.on('connect_error', (error) => {
      setConnectionState('error')
      onErrorRef.current?.({ message: error.message || 'Unable to connect to the classroom.', code: 'SOCKET_CONNECTION_ERROR' })
    })

    socket.on('error', (error: string | { message?: string; code?: string }) => {
      setConnectionState('error')
      onErrorRef.current?.(
        typeof error === 'string'
          ? { message: error, code: 'SOCKET_ERROR' }
          : { message: error.message || 'A classroom error occurred.', code: error.code },
      )
    })

    socket.on('room-joined', async (payload) => {
      setHasJoined(true)
      const existingParticipants: Participant[] = payload.participants || []
      setParticipants(existingParticipants)
      onRoomJoinedRef.current?.(payload)

      // Initiate WebRTC offers to existing participants in the room
      for (const p of existingParticipants) {
        if (p.userId !== currentUserId) {
          try {
            const pc = createPeerConnection(p.userId, socket)
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            })
            await pc.setLocalDescription(offer)
            socket.emit('offer', {
              sdp: offer,
              to: p.userId,
            })
          } catch (err) {
            console.error('Error initiating offer to', p.userId, err)
          }
        }
      }
    })

    socket.on('participant-joined', (payload) => {
      setParticipants(payload.participants || [])
    })

    socket.on('participant-left', (payload) => {
      if (payload.userId) {
        removePeerConnection(payload.userId)
      }
      setParticipants(payload.participants || [])
    })

    // WebRTC Offer received
    socket.on('offer', async (payload) => {
      const fromUserId = payload.from
      if (!fromUserId || fromUserId === currentUserId) return
      if (payload.to && payload.to !== currentUserId) return

      try {
        const pc = createPeerConnection(fromUserId, socket)
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', {
          sdp: answer,
          to: fromUserId,
        })
      } catch (err) {
        console.error('Error handling offer from', fromUserId, err)
      }
    })

    // WebRTC Answer received
    socket.on('answer', async (payload) => {
      const fromUserId = payload.from
      if (!fromUserId || fromUserId === currentUserId) return
      if (payload.to && payload.to !== currentUserId) return

      try {
        const pc = peerConnections.current.get(fromUserId)
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        }
      } catch (err) {
        console.error('Error handling answer from', fromUserId, err)
      }
    })

    // ICE Candidate received
    socket.on('ice-candidate', async (payload) => {
      const fromUserId = payload.from
      if (!fromUserId || fromUserId === currentUserId) return
      if (payload.to && payload.to !== currentUserId) return

      try {
        const pc = peerConnections.current.get(fromUserId)
        if (pc && payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
        }
      } catch (err) {
        console.error('Error adding ICE candidate from', fromUserId, err)
      }
    })

    // Media status toggle updates from peers
    socket.on('media-toggle', (payload) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === payload.userId ? { ...p, ...payload } : p))
      )
    })

    // Hand raise events
    socket.on('raise-hand', (payload: { userId: string; userName?: string; isHandRaised: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === payload.userId ? { ...p, isHandRaised: payload.isHandRaised } : p))
      )
      if (payload.userId === currentUserId) {
        setIsHandRaised(payload.isHandRaised)
      }
    })


    // Chat messages
    socket.on('chat-message', (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null

      // Clean all peer connections
      peerConnections.current.forEach((pc) => pc.close())
      peerConnections.current.clear()

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
        screenStreamRef.current = null
      }
    }
  }, [accessToken, sessionId, currentUserId, createPeerConnection, removePeerConnection])

  // Join Classroom Room
  const joinRoom = useCallback(async () => {
    const socket = socketRef.current
    if (!socket || !socket.connected) {
      setConnectionState('error')
      onErrorRef.current?.({ message: 'Socket not connected. Please check your connection.', code: 'SOCKET_DISCONNECTED' })
      return
    }

    // Try starting local audio/video media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      setIsVideoOn(true)
      setIsAudioOn(true)
    } catch (mediaErr) {
      console.warn('Could not auto-start camera/microphone, continuing without media:', mediaErr)
      // Fallback: create empty stream or proceed without media
    }

    socket.emit('join-room', sessionId)
  }, [sessionId])

  // Leave Classroom Room
  const leaveRoom = useCallback(() => {
    const socket = socketRef.current
    if (socket) {
      socket.emit('leave-room', sessionId)
    }

    // Clean tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }

    peerConnections.current.forEach((pc) => pc.close())
    peerConnections.current.clear()
    setRemoteStreams({})
    setParticipants([])
    setHasJoined(false)
    setIsVideoOn(false)
    setIsAudioOn(false)
    setIsScreenSharing(false)
  }, [sessionId])

  // Toggle Video (Camera)
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioOnRef.current })
        localStreamRef.current = stream
        setLocalStream(stream)
        setIsVideoOn(true)

        // Replace tracks in all peer connections
        const videoTrack = stream.getVideoTracks()[0]
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
          } else if (videoTrack) {
            pc.addTrack(videoTrack, stream)
          }
        })

        socketRef.current?.emit('media-toggle', {
          isVideoOn: true,
          isAudioOn: isAudioOnRef.current,
          isScreenSharing: isScreenSharingRef.current,
        })
      } catch (err: any) {
        onErrorRef.current?.({ message: 'Unable to access camera: ' + (err.message || 'Permission denied') })
      }
      return
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      const newState = videoTrack.enabled
      setIsVideoOn(newState)
      socketRef.current?.emit('media-toggle', {
        isVideoOn: newState,
        isAudioOn: isAudioOnRef.current,
        isScreenSharing: isScreenSharingRef.current,
      })
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const newVideoTrack = newStream.getVideoTracks()[0]
        localStreamRef.current.addTrack(newVideoTrack)
        setIsVideoOn(true)

        peerConnections.current.forEach((pc) => {
          pc.addTrack(newVideoTrack, localStreamRef.current!)
        })

        socketRef.current?.emit('media-toggle', {
          isVideoOn: true,
          isAudioOn: isAudioOnRef.current,
          isScreenSharing: isScreenSharingRef.current,
        })
      } catch (err: any) {
        onErrorRef.current?.({ message: 'Unable to start video: ' + err.message })
      }
    }
  }, [])

  // Toggle Audio (Microphone)
  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOnRef.current })
        localStreamRef.current = stream
        setLocalStream(stream)
        setIsAudioOn(true)

        const audioTrack = stream.getAudioTracks()[0]
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'audio')
          if (sender && audioTrack) {
            sender.replaceTrack(audioTrack)
          } else if (audioTrack) {
            pc.addTrack(audioTrack, stream)
          }
        })

        socketRef.current?.emit('media-toggle', {
          isVideoOn: isVideoOnRef.current,
          isAudioOn: true,
          isScreenSharing: isScreenSharingRef.current,
        })
      } catch (err: any) {
        onErrorRef.current?.({ message: 'Unable to access microphone: ' + (err.message || 'Permission denied') })
      }
      return
    }

    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      const newState = audioTrack.enabled
      setIsAudioOn(newState)
      socketRef.current?.emit('media-toggle', {
        isVideoOn: isVideoOnRef.current,
        isAudioOn: newState,
        isScreenSharing: isScreenSharingRef.current,
      })
    }
  }, [])

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
        screenStreamRef.current = null
      }
      setIsScreenSharing(false)

      // Restore camera track to all peers
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
          }
        })
      }

      socketRef.current?.emit('media-toggle', {
        isVideoOn: isVideoOnRef.current,
        isAudioOn: isAudioOnRef.current,
        isScreenSharing: false,
      })
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        screenStreamRef.current = screenStream
        setIsScreenSharing(true)

        const screenVideoTrack = screenStream.getVideoTracks()[0]

        // Replace track in peer connections
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          if (sender && screenVideoTrack) {
            sender.replaceTrack(screenVideoTrack)
          } else if (screenVideoTrack) {
            pc.addTrack(screenVideoTrack, screenStream)
          }
        })

        screenVideoTrack.onended = () => {
          // User clicked "Stop sharing" on browser chrome
          setIsScreenSharing(false)
          screenStreamRef.current = null
          if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0]
            peerConnections.current.forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
              if (sender && videoTrack) {
                sender.replaceTrack(videoTrack)
              }
            })
          }
          socketRef.current?.emit('media-toggle', {
            isVideoOn: isVideoOnRef.current,
            isAudioOn: isAudioOnRef.current,
            isScreenSharing: false,
          })
        }

        socketRef.current?.emit('media-toggle', {
          isVideoOn: isVideoOnRef.current,
          isAudioOn: isAudioOnRef.current,
          isScreenSharing: true,
        })
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          onErrorRef.current?.({ message: 'Could not share screen: ' + err.message })
        }
      }
    }
  }, [isScreenSharing])

  // Toggle Hand Raise
  const toggleHandRaise = useCallback(() => {
    const newState = !isHandRaised
    setIsHandRaised(newState)
    socketRef.current?.emit('raise-hand', { isHandRaised: newState })
  }, [isHandRaised])

  // Lower participant hand (for teacher)
  const lowerParticipantHand = useCallback((targetUserId: string) => {
    socketRef.current?.emit('raise-hand', { targetUserId, isHandRaised: false })
  }, [])

  // Send Chat Message
  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return
    socketRef.current?.emit('chat-message', { text: text.trim() })
  }, [])

  return {
    connectionState,
    participants,
    chatMessages,
    localStream: screenStreamRef.current || localStream,
    remoteStreams,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    isHandRaised,
    hasJoined,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    toggleHandRaise,
    lowerParticipantHand,
    sendChatMessage,
  }
}

