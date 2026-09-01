import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { chatbotApi } from '@/services/api/chatbot'
import { useAuthStore } from '@/stores/auth.store'
import type { ChatMessage as ChatMessageType } from '@/types/chatbot'

let messageSequence = 0

function generateId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  messageSequence += 1
  return `${Date.now().toString(36)}-${messageSequence.toString(36)}`
}


export interface UseChatbotResult {
  messages: ChatMessageType[]
  input: string
  isSending: boolean
  error: string | null
  authRequired: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  sendMessage: (text: string) => Promise<void>
  clearConversation: () => void
  setInput: (value: string) => void
  suggestedPrompts: string[]
}

export function useChatbot(): UseChatbotResult {
  const { isAuthenticated } = useAuthStore()

  const welcomeMessage = useMemo<ChatMessageType>(() => ({
    id: 'welcome',
    role: 'assistant',
    content: isAuthenticated
      ? "Hi! I'm the EduFlow AI assistant. Ask me anything about your courses, assignments, quizzes, live sessions, or notices."
      : "Hi! I'm the EduFlow AI assistant. Ask me general questions about EduFlow courses, enrollment, and platform features.",
  }), [isAuthenticated])

  const [messages, setMessages] = useState<ChatMessageType[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedPrompts = isAuthenticated
    ? [
        'What assignments do I have due?',
        'Show my upcoming live sessions',
        'What is my attendance rate?',
        'Any new notifications?',
        'Help me with my courses',
      ]
    : [
        'What courses does EduFlow offer?',
        'What is EduFlow?',
        'How does enrollment work?',
        'How do I register?',
        'What learning features are available?',
      ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: ChatMessageType = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage]
      return updated
    })
    setInput('')
    setIsSending(true)
    setError(null)
    setAuthRequired(false)

    const currentIsAuthenticated = useAuthStore.getState().isAuthenticated

    // Build recent conversation history (excluding welcome message & error messages)
    const history = messages
      .filter((m) => m.id !== 'welcome' && !m.error && m.content)
      .slice(-6)
      .map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }))

    try {
      const result = await chatbotApi.sendMessage(text, history, !currentIsAuthenticated)

      const assistantMessage: ChatMessageType = {
        id: generateId(),
        role: 'assistant',
        content: result.reply,
        sources: result.sources,
        queryDomain: result.queryDomain,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 && currentIsAuthenticated) {
        setAuthRequired(true)
        const message = 'Your session has expired. Please log in again to access personalized data.'
        setError(message)
        const errorMessage: ChatMessageType = {
          id: generateId(),
          role: 'assistant',
          content: message,
          timestamp: Date.now(),
          error: true,
        }
        setMessages((prev) => [...prev, errorMessage])
      } else {
        const message = err?.response?.data?.message || 'Something went wrong. Please try again.'
        setError(message)
        toast.error(message)
        const errorMessage: ChatMessageType = {
          id: generateId(),
          role: 'assistant',
          content: message,
          timestamp: Date.now(),
          error: true,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } finally {
      setIsSending(false)
    }
  }, [messages])


  const clearConversation = useCallback(() => {
    setMessages([welcomeMessage])
    setError(null)
    setAuthRequired(false)
  }, [welcomeMessage])

  return {
    messages,
    input,
    isSending,
    error,
    authRequired,
    messagesEndRef,
    sendMessage,
    clearConversation,
    setInput,
    suggestedPrompts,
  }
}
