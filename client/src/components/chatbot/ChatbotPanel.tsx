import { useEffect, useState } from 'react'
import { BotIcon, XIcon } from '@/components/ui/icons'

import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useChatbot } from '@/hooks/useChatbot'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface ChatbotPanelProps {
  open: boolean
  onClose?: () => void
  embedded?: boolean
}

export function ChatbotPanel({ open, onClose, embedded = false }: ChatbotPanelProps) {
  const {
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
  } = useChatbot()

  const { isAuthenticated } = useAuthStore()
  const [showSources, setShowSources] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open && !embedded) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, embedded, onClose])

  if (!open && !embedded) return null

  const panelClasses = embedded
    ? 'flex h-[min(600px,calc(100dvh-11rem))] min-h-[380px] w-full flex-col rounded-xl border border-border bg-surface shadow-sm overflow-hidden'
    : 'fixed bottom-20 right-4 z-50 flex h-[min(580px,calc(100dvh-6rem))] max-h-[600px] w-[calc(100vw-2rem)] max-w-[380px] sm:max-w-[400px] flex-col rounded-xl border border-border bg-surface shadow-xl sm:bottom-6 sm:right-6 overflow-hidden'

  return (
    <div className={panelClasses}>
      {/* Simple Clean Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <BotIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-text">EduFlow AI</h3>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                Powered By - Gemini
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              {isAuthenticated ? 'Academic Assistant' : 'Platform & Admission Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearConversation}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background text-text hover:bg-error/10 hover:text-error hover:border-error/30 transition-all cursor-pointer shadow-2xs"
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background text-text hover:bg-error/10 hover:text-error hover:border-error/30 transition-all cursor-pointer shadow-2xs"
              title="Close chat"
              aria-label="Close chat"
            >
              <XIcon className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>


      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background/30">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            showSources={showSources[message.id] ?? false}
            onToggleSources={() => setShowSources((prev) => ({ ...prev, [message.id]: !prev[message.id] }))}
          />
        ))}

        {/* Quick Suggestions Chips */}
        {messages.length === 1 && messages[0].id === 'welcome' && !isSending && (
          <div className="mt-3">
            <p className="text-[11px] font-medium text-text-muted mb-2">
              Suggested questions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text transition-colors hover:border-primary hover:text-primary active:scale-98"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Simple Thinking Indicator */}
        {isSending && (
          <div className="flex gap-2.5 mb-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
              <BotIcon className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <span>Thinking</span>
                <span className="h-1 w-1 animate-bounce rounded-full bg-text-muted [animation-delay:0ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-text-muted [animation-delay:150ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-text-muted [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {authRequired && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-xs text-text-muted">
              Please log in to view your personalized academic data.
            </p>
            <Link
              to="/login"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Sign in
            </Link>
          </div>
        )}

        {error && !authRequired && (
          <div className="mt-3 rounded-lg border border-error/20 bg-error/5 p-2.5 text-xs text-error">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Simple Input Bar */}
      <div className="border-t border-border bg-surface p-2.5">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          disabled={isSending}
          placeholder={isAuthenticated ? 'Ask about courses, classes, exams...' : 'Ask about courses, fees, admissions...'}
        />
      </div>
    </div>
  )
}


