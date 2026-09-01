import { Link } from 'react-router-dom'

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-text py-16">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/10" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Your next learning milestone starts here.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/80">
            Explore available courses and find the path that fits your goals.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/courses"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-white hover:bg-primary/90"
            >
              Explore Courses
            </Link>
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 text-base font-medium text-white hover:bg-white/20"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
