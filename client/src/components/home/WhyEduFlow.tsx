import { Link } from 'react-router-dom'
import { BookOpenIcon, MonitorIcon, UsersIcon, AwardIcon } from '@/components/ui/icons'

const benefits = [
  {
    title: 'Structured Learning',
    description: 'Learn through organized courses and materials designed for real outcomes.',
    icon: BookOpenIcon,
  },
  {
    title: 'Learn Anywhere',
    description: 'Access your learning experience from wherever you are, on any device.',
    icon: MonitorIcon,
  },
  {
    title: 'Practice & Assess',
    description: 'Assignments and quizzes help reinforce what you learn.',
    icon: AwardIcon,
  },
  {
    title: 'Track Progress',
    description: 'Keep track of your learning journey with transparent progress tracking.',
    icon: UsersIcon,
  },
]

export function WhyEduFlow() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-medium text-secondary">Why EduFlow</span>
            <h2 className="mt-2 text-3xl font-bold text-text">Everything you need to keep moving forward.</h2>
            <p className="mt-4 text-text-muted">
              EduFlow combines structured course content with live interaction and assessment so you can
              actually finish what you start.
            </p>
            <div className="mt-8">
              <Link
                to="/courses"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-white hover:bg-primary/90"
              >
                Browse Courses
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-border bg-background p-5 transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">{item.title}</h3>
                  <p className="mt-1 text-sm text-text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
