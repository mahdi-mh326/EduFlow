import { Link } from 'react-router-dom'
import { BookOpenIcon, FileTextIcon, MonitorIcon, BellIcon, BarChartIcon, CheckCircleIcon } from '@/components/ui/icons'

const features = [
  { title: 'Course Materials', description: 'Structured lessons and resources for every course.', icon: BookOpenIcon },
  { title: 'Assignments', description: 'Hands-on tasks that reinforce what you learn.', icon: FileTextIcon },
  { title: 'Quizzes', description: 'Knowledge checks to confirm understanding.', icon: BarChartIcon },
  { title: 'Live Classes', description: 'Real-time sessions with instructors and peers.', icon: MonitorIcon },
  { title: 'Attendance', description: 'Track participation and stay accountable.', icon: CheckCircleIcon },
  { title: 'Notifications', description: 'Stay updated on classes, deadlines, and announcements.', icon: BellIcon },
]

export function LearningExperience() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl bg-background shadow-lg ring-1 ring-border">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-danger/70" />
                  <span className="h-3 w-3 rounded-full bg-accent/70" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />
                  <span className="ml-2 text-xs text-text-muted">EduFlow Classroom</span>
                </div>
                <div className="flex flex-1">
                  <div className="hidden w-36 border-r border-border bg-background p-3 sm:block">
                    <div className="space-y-2">
                      <div className="h-8 rounded-lg bg-primary/10" />
                      <div className="h-8 rounded-lg bg-secondary/10" />
                      <div className="h-8 rounded-lg bg-accent/10" />
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10" />
                    <div className="space-y-2">
                      <div className="h-3 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                      <div className="h-8 w-28 rounded-lg bg-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-sm font-medium text-secondary">Learning Experience</span>
            <h2 className="mt-2 text-3xl font-bold text-text">One place for your complete learning journey.</h2>
            <p className="mt-4 text-text-muted">
              EduFlow is more than a course catalog. It is a complete learning environment with materials,
              assessments, live classes, and progress tracking.
            </p>
            <div className="mt-8 space-y-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text">{feature.title}</h3>
                    <p className="text-xs text-text-muted">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                to="/courses"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-white hover:bg-primary/90"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
