import { CheckCircleIcon, BookOpenIcon, FileTextIcon, MonitorIcon, TrendingUpIcon } from '@/components/ui/icons'

const steps = [
  { number: '01', title: 'Explore Courses', description: 'Browse the course catalog and find topics that match your goals.', icon: BookOpenIcon },
  { number: '02', title: 'Choose Your Course', description: 'Review course details, curriculum, and instructor information.', icon: FileTextIcon },
  { number: '03', title: 'Enroll & Get Access', description: 'Complete enrollment to unlock course materials and live sessions.', icon: CheckCircleIcon },
  { number: '04', title: 'Join & Learn', description: 'Attend live classes, submit assignments, and take quizzes.', icon: MonitorIcon },
  { number: '05', title: 'Track Your Progress', description: 'Monitor attendance, grades, and growth through your learning dashboard.', icon: TrendingUpIcon },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-sm font-medium text-secondary">How It Works</span>
          <h2 className="mt-2 text-3xl font-bold text-text">Your Learning Journey</h2>
          <p className="mt-3 max-w-2xl mx-auto text-text-muted">
            From discovery to completion, EduFlow supports you at every step.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 hidden h-full w-px bg-border md:block" aria-hidden="true" />

          <div className="grid gap-8 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-md">
                  <span className="text-sm font-bold">{step.number}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text">{step.title}</h3>
                <p className="mt-2 text-xs text-text-muted">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="mt-4 hidden text-primary md:block" aria-hidden="true">
                    <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
