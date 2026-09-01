import { Link } from 'react-router-dom'
import { PlayIcon, BookOpenIcon, UsersIcon, TrendingUpIcon, ClockIcon, StarIcon } from '@/components/ui/icons'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 via-background to-background">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-blue-400/5 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-indigo-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/70 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Modern E-Learning & Classroom Platform
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-text sm:text-5xl lg:text-5xl leading-[1.15]">
              Learn Smarter.{' '}
              <span className="text-primary">Achieve More.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-text-sub sm:text-lg">
              Empower your future with live interactive classrooms, expert instructor-led courses,
              real-time assignments, quizzes, and structured skill tracking.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to="/courses"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm shadow-primary/25 hover:bg-primary/95 transition-all"
              >
                Browse All Courses →
              </Link>
              <Link
                to="/register"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-text hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all"
              >
                Join as Student
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-text-muted pt-6 border-t border-border/80">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-primary">
                  <UsersIcon className="h-4 w-4" />
                </div>
                <span className="font-medium text-text">Verified Instructors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <BookOpenIcon className="h-4 w-4" />
                </div>
                <span className="font-medium text-text">Structured Curriculum</span>
              </div>
            </div>
          </div>


          <div className="relative">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-xl">
              <div className="overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-border">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-danger/70" />
                      <span className="h-3 w-3 rounded-full bg-accent/70" />
                      <span className="h-3 w-3 rounded-full bg-success/70" />
                      <span className="ml-2 text-xs text-text-muted">EduFlow Learning</span>
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">In Progress</span>
                  </div>
                  <div className="flex flex-1">
                    <div className="hidden w-40 border-r border-border bg-background p-3 sm:block">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-1.5">
                          <BookOpenIcon className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-text">My Courses</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                          <TrendingUpIcon className="h-4 w-4 text-text-muted" />
                          <span className="text-xs text-text-muted">Progress</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                          <PlayIcon className="h-4 w-4 text-text-muted" />
                          <span className="text-xs text-text-muted">Live Classes</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-text-muted">Currently Learning</p>
                            <p className="text-sm font-semibold text-text">Full Stack Web Development</p>
                          </div>
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Advanced</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-text-muted">
                            <span>Progress</span>
                            <span>78%</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-border">
                            <div className="h-2 rounded-full bg-primary" style={{ width: '78%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <PlayIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">React Fundamentals</p>
                            <p className="text-xs text-text-muted">Lesson 12 of 24</p>
                          </div>
                          <span className="text-xs text-text-muted">45m</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                            <ClockIcon className="h-5 w-5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">Live Class: Advanced Patterns</p>
                            <p className="text-xs text-text-muted">Today, 3:00 PM</p>
                          </div>
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Live</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                            <UsersIcon className="h-4 w-4 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">Sarah Johnson</p>
                            <p className="text-xs text-text-muted">Senior Instructor</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <StarIcon className="h-3.5 w-3.5 text-accent" />
                            <span className="text-xs font-medium text-text">4.9</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 -top-4 hidden rounded-xl bg-surface p-3 shadow-lg ring-1 ring-border lg:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <TrendingUpIcon className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text">Progress</p>
                    <p className="text-xs text-text-muted">78% completed</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 hidden rounded-xl bg-surface p-3 shadow-lg ring-1 ring-border lg:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <StarIcon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text">Achievement</p>
                    <p className="text-xs text-text-muted">Course Champion</p>
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
