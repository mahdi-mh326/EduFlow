import { type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components'
import { SendIcon } from '@/components/ui/icons'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask EduFlow AI...',
  maxLength = 2000,
}: ChatInputProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = value.trim()
      if (!trimmed || disabled) return
      onSend(trimmed)
    }
  }

  const remaining = maxLength - value.length
  const isNearLimit = remaining <= 200

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="relative flex-1">
        <label htmlFor="chatbot-message" className="sr-only">Message for EduFlow AI</label>
        <textarea
          id="chatbot-message"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          aria-label="Message for EduFlow AI"
          className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm text-text placeholder:text-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all shadow-2xs"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        {isNearLimit && (
          <span className="absolute bottom-1.5 right-3 text-[10px] font-medium text-text-muted">
            {remaining}
          </span>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={disabled || !value.trim()}
        className="h-[42px] w-[42px] shrink-0 rounded-xl p-0 shadow-sm shadow-primary/20 disabled:opacity-40 transition-all"
        aria-label="Send message"
      >
        <SendIcon className="h-4 w-4" />
      </Button>
    </form>
  )
}

