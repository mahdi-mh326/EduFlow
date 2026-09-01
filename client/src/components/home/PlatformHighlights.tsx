import { BookOpenIcon, MonitorIcon, UsersIcon, CheckCircleIcon } from '@/components/ui/icons'

const highlights = [
  {
    title: 'Structured Learning',
    description: 'Learn at your own pace with organized courses and materials.',
    icon: BookOpenIcon,
  },
  {
    title: 'Live Classes',
    description: 'Attend real-time sessions and interact with instructors.',
    icon: MonitorIcon,
  },
  {
    title: 'Practical Assessments',
    description: 'Assignments and quizzes that reinforce what you learn.',
    icon: CheckCircleIcon,
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor attendance, grades, and growth over time.',
    icon: UsersIcon,
  },
]

export function PlatformHighlights() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.title} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-text">{item.title}</h3>
              <p className="mt-1 text-xs text-text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
