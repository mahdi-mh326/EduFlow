import { useRef, useEffect } from 'react'
import { BotIcon, ChevronDownIcon, AlertTriangleIcon } from '@/components/ui/icons'
import type { ChatMessage as ChatMessageType } from '@/types/chatbot'

function formatTime(timestamp: number | undefined) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function renderFormattedContent(text: string) {
  if (!text) return null

  // Split by line breaks
  const lines = text.split('\n')

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />
        }

        // Check if it's a bullet item (*, -, •)
        const isBullet = /^[\*\-•]\s+/.test(trimmed)
        const content = isBullet ? trimmed.replace(/^[\*\-•]\s+/, '') : trimmed

        // Parse bold **text** and markdown links [text](url)
        const formattedParts = parseInlineMarkdown(content)

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <div className="flex-1">{formattedParts}</div>
            </div>
          )
        }

        // Header style if starts with ### or **Title:**
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          return (
            <h4 key={idx} className="font-bold text-text pt-1">
              {trimmed.replace(/^#+\s*/, '')}
            </h4>
          )
        }

        return <p key={idx}>{formattedParts}</p>
      })}
    </div>
  )
}

function parseInlineMarkdown(text: string): (string | React.ReactNode)[] {
  // Regex to match **bold** and [text](url)
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  const parts: (string | React.ReactNode)[] = []
  let lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-text">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
            target={linkMatch[2].startsWith('http') ? '_blank' : '_self'}
            rel="noreferrer"
          >
            {linkMatch[1]} ↗
          </a>
        )
      } else {
        parts.push(token)
      }
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

interface ChatMessageProps {
  message: ChatMessageType
  showSources?: boolean
  onToggleSources?: () => void
}

export function ChatMessage({ message, showSources, onToggleSources }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [message.content])

  const hasSources = message.sources && message.sources.length > 0

  return (
    <div className={`flex gap-2.5 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-white shadow-sm mt-0.5">
          <BotIcon className="h-4 w-4" />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-text font-bold text-xs shadow-sm mt-0.5">
          You
        </div>
      )}

      <div className={`flex max-w-[85%] sm:max-w-[80%] flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm transition-all shadow-sm ${
            isUser
              ? 'bg-primary text-white rounded-tr-xs shadow-primary/10'
              : message.error
              ? 'bg-error/10 border border-error/30 text-error rounded-tl-xs'
              : 'bg-surface border border-border/80 text-text rounded-tl-xs hover:border-primary/30'
          }`}
        >
          {message.error ? (
            <div className="flex items-start gap-2 text-error">
              <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{message.content}</span>
            </div>
          ) : (
            renderFormattedContent(message.content)
          )}
        </div>

        <div className="flex items-center gap-2 px-1 text-[11px] text-text-muted">
          {message.timestamp && <span>{formatTime(message.timestamp)}</span>}
          {hasSources && (
            <button
              type="button"
              onClick={onToggleSources}
              className="flex items-center gap-1 font-medium text-primary transition-colors hover:underline"
              aria-expanded={showSources}
            >
              <span>• {message.sources!.length} {message.sources!.length === 1 ? 'source' : 'sources'}</span>
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform duration-200 ${showSources ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {hasSources && showSources && (
          <div className="mt-1 w-full rounded-xl border border-border/80 bg-background/60 backdrop-blur p-2.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Verified Sources
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources!.map((source, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text shadow-xs"
                >
                  <span className="font-semibold text-primary capitalize">{source.type}</span>
                  <span className="text-text-muted">·</span>
                  <span className="font-medium text-text truncate max-w-[200px]">{source.title}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  )
}

