import { MonitorIcon, BookOpenIcon, BarChartIcon, CheckCircleIcon } from '@/components/ui/icons'

const capabilities = [
  { label: 'Live Learning', description: 'Real-time instruction and interaction with instructors and peers.', icon: MonitorIcon },
  { label: 'Course Materials', description: 'Organized courses with clear milestones and progression.', icon: BookOpenIcon },
  { label: 'Assignments', description: 'Hands-on tasks that reinforce learning outcomes.', icon: CheckCircleIcon },
  { label: 'Quizzes', description: 'Knowledge checks to confirm understanding and retention.', icon: BarChartIcon },
]

export function PlatformCapabilities() {
  return (
    <section className="border-y border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-sm font-medium text-secondary">Platform</span>
          <h2 className="mt-2 text-3xl font-bold text-text">Designed for Modern Learners</h2>
          <p className="mt-3 max-w-2xl mx-auto text-text-muted">
            A learning environment built around how people actually learn today.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              {capabilities.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface p-5 text-center transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-text">{item.label}</h3>
                  <p className="mt-1 text-xs text-text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-2xl bg-surface shadow-lg ring-1 ring-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-xs font-medium text-text-muted">EduFlow Platform</span>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-danger/70" />
                  <span className="h-2 w-2 rounded-full bg-accent/70" />
                  <span className="h-2 w-2 rounded-full bg-success/70" />
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpenIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text">Full Stack Web Development</p>
                          <p className="text-xs text-text-muted">Advanced • 12 weeks</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">In Progress</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-border">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '65%' }} />
                    </div>
                    <p className="mt-1 text-xs text-text-muted">65% completed</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                        <CheckCircleIcon className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Completed</p>
                        <p className="text-sm font-semibold text-text">8 lessons</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <BarChartIcon className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Quiz Score</p>
                        <p className="text-sm font-semibold text-text">92%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
