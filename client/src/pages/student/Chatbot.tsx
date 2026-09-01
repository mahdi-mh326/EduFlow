import { Container } from '@/components'
import { ChatbotPanel } from '@/components/chatbot'

export function ChatbotPage() {
  return (
    <Container className="py-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">AI Assistant</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ask questions about your courses, assignments, quizzes, live sessions, and more.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <ChatbotPanel open embedded />
        </div>
      </div>
    </Container>
  )
}
