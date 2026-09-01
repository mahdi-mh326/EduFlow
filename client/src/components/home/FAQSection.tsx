import { useState } from 'react'
import { Container, Badge } from '@/components'
import { ChevronDownIcon, HelpCircleIcon } from '@/components/ui/icons'

interface FAQItem {
  id: string
  category: 'general' | 'payment' | 'classes' | 'features'
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    id: '1',
    category: 'general',
    question: 'How do I get started and enroll in a course on EduFlow?',
    answer:
      'Getting started is quick and easy! Simply create an account with your email and name, verify your OTP, browse our Course Catalog, select your desired course, and click "Enroll Now". You will be guided through our secure payment checkout.',
  },
  {
    id: '2',
    category: 'payment',
    question: 'What payment methods are supported for course enrollment?',
    answer:
      'We support all major payment methods in Bangladesh through the trusted SSLCommerz gateway, including bKash, Nagad, Rocket, Upay, Visa, Mastercard, and Internet Banking. Your enrollment is activated instantly upon payment confirmation.',
  },
  {
    id: '3',
    category: 'classes',
    question: 'What happens if a course does not have an active batch yet?',
    answer:
      'If a course is published but its class batch is still being prepared, you can click "Save Course" to add it to your saved courses. As soon as an admin or teacher opens a new batch, you will receive an instant notification to enroll.',
  },
  {
    id: '4',
    category: 'classes',
    question: 'How do live online classes and attendance work?',
    answer:
      'Teachers conduct live interactive sessions directly inside our Virtual Classroom with audio/video, screen sharing, live chat, and whiteboard tools. When you join the live class, your attendance is automatically recorded by the system.',
  },
  {
    id: '5',
    category: 'features',
    question: 'Can I access study materials, assignments, and quizzes?',
    answer:
      'Yes! Assigned teachers upload class-specific study materials (PDFs, slides, source code) directly to your Class Hub. You will also submit assignments for teacher grading and take timed multiple-choice quizzes with instant results.',
  },
  {
    id: '6',
    category: 'features',
    question: 'How does the built-in Gemini AI Assistant help students?',
    answer:
      'Our AI Assistant is powered by Google Gemini 3 Flash Lite. It provides personalized, 24/7 answers regarding your upcoming assignment deadlines, class schedules, exam dates, study materials, and admission queries in both English and Bengali.',
  },
]

const categories = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'General & Account' },
  { id: 'payment', label: 'Payment & Enrollment' },
  { id: 'classes', label: 'Live Classes & Batches' },
  { id: 'features', label: 'Learning Features & AI' },
]

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [openId, setOpenId] = useState<string | null>('1')

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter((faq) => faq.category === activeCategory)

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="py-16 sm:py-24 bg-surface/50 border-t border-border">
      <Container>
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <Badge variant="primary" className="mb-3">
            <HelpCircleIcon className="h-3.5 w-3.5 mr-1" />
            Frequently Asked Questions
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text">
            Everything You Need to Know
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted leading-relaxed">
            Find quick answers to common questions about courses, payments, live classes, and our smart learning features.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'bg-surface border border-border text-text-muted hover:border-primary/40 hover:text-text'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="mx-auto max-w-3xl space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-primary/40 bg-surface shadow-sm ring-1 ring-primary/10'
                    : 'border-border bg-surface/80 hover:border-border/80 hover:bg-surface'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-text pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'bg-background text-text-muted'
                    }`}
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-text-muted leading-relaxed border-t border-border/50 animate-in fade-in duration-150">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="mx-auto max-w-xl mt-12 rounded-2xl border border-border bg-surface p-6 text-center shadow-xs">
          <h4 className="text-base font-bold text-text">Still have more questions?</h4>
          <p className="mt-1 text-xs text-text-muted">
            Chat with our 24/7 AI Assistant or explore our complete course catalog.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/courses"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all"
            >
              Browse All Courses
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}
