import { useState } from 'react'
import { BotIcon } from '@/components/ui/icons'
import { ChatbotPanel } from './ChatbotPanel'

export function ChatbotButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-3.5 py-2.5 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
          aria-label="Open AI assistant"
          title="AI Assistant"
        >
          <BotIcon className="h-5 w-5" />
          <span className="text-xs font-semibold">AI Assistant</span>
        </button>
      )}

      <ChatbotPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}


