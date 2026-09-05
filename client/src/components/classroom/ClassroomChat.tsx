import { useState, useRef, useEffect } from 'react'
import { Button, Badge } from '@/components'
import { SendIcon, MessageSquareIcon } from '@/components/ui/icons'
import type { ChatMessage } from '@/hooks/useClassroomSocket'

interface ClassroomChatProps {
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  currentUserId?: string
}

export function ClassroomChat({ messages, onSendMessage, currentUserId }: ClassroomChatProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    onSendMessage(inputText)
    setInputText('')
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface shadow-sm">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-bold text-text">Live Classroom Chat</h3>
        <p className="text-xs text-text-muted">Ask questions and discuss in real-time</p>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-text-muted py-8">
            <MessageSquareIcon className="h-8 w-8 mb-2 text-text-muted/60" />
            <p className="text-xs">No messages yet. Say hello to the class!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-text-muted">
                  <span className="font-semibold text-text">{isMe ? 'You' : msg.senderName}</span>
                  <Badge
                    variant={msg.senderRole === 'teacher' ? 'default' : 'neutral'}
                    className="text-[9px] py-0 px-1 capitalize"
                  >
                    {msg.senderRole}
                  </Badge>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed max-w-[85%] break-words ${
                    isMe
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-background border border-border text-text rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <Button type="submit" variant="primary" size="sm" disabled={!inputText.trim()}>
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
