import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchInput, Select, Button, EmptyState, ErrorState, Container, Skeleton, Pagination } from '@/components'
import { CourseCard } from '@/components/home'
import { courseApi, type CourseResponse } from '@/services/api/course'
import { InboxIcon } from '@/components/ui/icons'

const categories = [
  { value: '', label: 'All categories' },
  'Programming', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Cyber Security', 'Artificial Intelligence', 'Data Science', 'Networking', 'Database',
  'Cloud Computing', 'DevOps', 'Other',
].map((value) => typeof value === 'string' ? { value, label: value } : value)

const levels = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const priceOptions = [
  { value: 'all', label: 'All prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'title', label: 'Title' },
]

type Filters = { search: string; category: string; level: string; price: string; sort: string }

function sortParams(sort: string): { sortBy: 'newest' | 'price' | 'title'; sortOrder: 'asc' | 'desc' } {
  if (sort === 'price-asc') return { sortBy: 'price', sortOrder: 'asc' }
  if (sort === 'price-desc') return { sortBy: 'price', sortOrder: 'desc' }
  if (sort === 'title') return { sortBy: 'title', sortOrder: 'asc' }
  return { sortBy: 'newest', sortOrder: 'desc' }
}

export function Courses() {
  const [filters, setFilters] = useState<Filters>({ search: '', category: '', level: '', price: 'all', sort: 'newest' })
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCourses = useCallback(async (nextPage = 1) => {
    setLoading(true)
    setError(null)
    try {
      const result = await courseApi.getCourses({
        page: nextPage,
        limit: 12,
        search: filters.search.trim() || undefined,
        category: filters.category || undefined,
        difficulty: filters.level || undefined,
        ...sortParams(filters.sort),
      })
      setCourses(result.data)
      setMeta(result.meta)
      setPage(nextPage)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = window.setTimeout(() => loadCourses(1), 250)
    return () => window.clearTimeout(timer)
  }, [loadCourses])

  const visibleCourses = useMemo(() => {
    if (filters.price === 'free') return courses.filter((course) => (course.offerPrice ?? course.price) === 0)
    if (filters.price === 'paid') return courses.filter((course) => (course.offerPrice ?? course.price) > 0)
    return courses
  }, [courses, filters.price])

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((prev) => ({ ...prev, [key]: value }))
  const clearFilters = () => setFilters({ search: '', category: '', level: '', price: 'all', sort: 'newest' })
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => key === 'sort' ? value !== 'newest' : value !== '' && value !== 'all')

  return (
    <section className="bg-background py-10">
      <Container>
        <div className="mb-6">
          <nav className="mb-4 text-sm text-text-muted" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-text" aria-current="page">Courses</li>
            </ol>
          </nav>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text">Explore Courses</h1>
              <p className="mt-1 text-sm text-text-muted">Find the right course to build practical skills and move closer to your goals.</p>
            </div>
            {!loading && <p className="text-sm text-text-muted">Showing <span className="font-medium text-text">{meta?.total ?? visibleCourses.length}</span> course{(meta?.total ?? visibleCourses.length) === 1 ? '' : 's'}</p>}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <SearchInput  value={filters.search} onChange={(value) => updateFilter('search', value)} placeholder="Search courses..." aria-label="Search courses" />
            </div>
            <Select label="Category" options={categories} value={filters.category} onChange={(event) => updateFilter('category', event.target.value)} />
            <Select label="Level" options={levels} value={filters.level} onChange={(event) => updateFilter('level', event.target.value)} />
            <Select label="Price" options={priceOptions} value={filters.price} onChange={(event) => updateFilter('price', event.target.value)} />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <Select label="Sort by" options={sortOptions} value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="sm:w-56" />
            {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading courses">
            {Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-xl border border-border bg-surface p-4"><Skeleton variant="rect" height="10rem" /><Skeleton variant="text" height="1.25rem" width="80%" className="mt-4" /><Skeleton variant="text" height="1rem" width="60%" className="mt-2" /></div>)}
          </div>
        ) : error ? (
          <ErrorState title="Unable to load courses" message={error} onRetry={() => loadCourses(page)} />
        ) : visibleCourses.length === 0 ? (
          <EmptyState title="No courses found" description={hasActiveFilters ? 'Try adjusting your filters to find available courses.' : 'Published courses will appear here when they are available.'} icon={<InboxIcon className="h-12 w-12" />} action={hasActiveFilters ? <Button variant="primary" onClick={clearFilters}>Clear filters</Button> : undefined} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleCourses.map((course) => <CourseCard key={course._id} course={course} />)}</div>
        )}

        {!loading && meta && meta.totalPages > 1 && <div className="mt-8"><Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={(nextPage) => { loadCourses(nextPage); window.scrollTo({ top: 0, behavior: 'smooth' }) }} /></div>}
      </Container>
    </section>
  )
}
