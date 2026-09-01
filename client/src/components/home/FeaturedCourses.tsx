import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Container, EmptyState, ErrorState, Skeleton } from '@/components'
import { courseApi, type CourseResponse } from '@/services/api/course'
import { CourseCard } from './CourseCard'

export function FeaturedCourses() {
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await courseApi.getCourses({ featured: true, limit: 4, sortBy: 'newest', sortOrder: 'desc' })
      if (result.data.length === 0) {
        const fallback = await courseApi.getCourses({ limit: 4, sortBy: 'newest', sortOrder: 'desc' })
        setCourses(fallback.data)
      } else {
        setCourses(result.data)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load featured courses.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  return (
    <section className="bg-background py-16">
      <Container>
        <div className="mb-10 text-center">
          <span className="text-sm font-medium text-secondary">Featured Learning</span>
          <h2 className="mt-2 text-3xl font-bold text-text">Explore courses built for your next step.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-text-muted">
            Discover carefully crafted courses designed to take your skills to the next level.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading featured courses">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-border bg-surface p-4">
                <Skeleton variant="rect" height="10rem" />
                <Skeleton variant="text" height="1.25rem" width="80%" className="mt-4" />
                <Skeleton variant="text" height="1rem" width="60%" className="mt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Unable to load featured courses" message={error} onRetry={loadCourses} />
        ) : courses.length === 0 ? (
          <EmptyState title="Featured courses coming soon" description="Published courses will appear here when they are available." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => <CourseCard key={course._id} course={course} />)}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/courses">
            <Button variant="outline" size="lg">View All Courses</Button>
          </Link>
        </div>
      </Container>
    </section>
  )
}
