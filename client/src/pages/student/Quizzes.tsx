import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Container, EmptyState, ErrorState, Pagination, SearchInput, Skeleton } from '@/components'
import { quizApi } from '@/services/api/quiz'
import type { StudentQuiz } from '@/types/quiz'
import { BookOpenIcon, ClockIcon, FileTextIcon, InboxIcon, UsersIcon } from '@/components/ui/icons'
import { formatDate } from '@/utils'

function getQuizState(quiz: StudentQuiz) {
  const now = Date.now()
  const start = new Date(quiz.startDate).getTime()
  const end = new Date(quiz.endDate).getTime()
  if (quiz.status !== 'published') return { label: quiz.status || 'Unavailable', variant: 'neutral' as const }
  if (Number.isFinite(start) && now < start) return { label: 'Upcoming', variant: 'primary' as const }
  if (Number.isFinite(end) && now > end) return { label: 'Closed', variant: 'warning' as const }
  return { label: 'Open', variant: 'success' as const }
}

export function Quizzes() {
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuizzes = useCallback(async (nextPage = 1, query = search) => {
    setLoading(true)
    setError(null)
    try {
      const result = await quizApi.getQuizzes({ page: nextPage, limit: 10, search: query.trim() || undefined })
      setQuizzes(result.data)
      setMeta(result.meta)
      setPage(nextPage)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load quizzes. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(() => loadQuizzes(1), 250)
    return () => window.clearTimeout(timer)
  }, [loadQuizzes])

  return (
    <Container className="py-8">
      <div className="mb-6"><h1 className="text-2xl font-bold text-text sm:text-3xl">Quizzes</h1><p className="mt-1 text-sm text-text-muted">Complete knowledge checks for your enrolled courses.</p></div>
      <div className="mb-6"><SearchInput value={search} onChange={setSearch} placeholder="Search quizzes..." aria-label="Search quizzes" className="max-w-md" /></div>
      {loading ? (
        <div className="space-y-4" aria-label="Loading quizzes">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-xl border border-border bg-surface p-5"><Skeleton variant="text" height="1.25rem" width="60%" /><Skeleton variant="text" height="1rem" width="40%" className="mt-2" /><Skeleton variant="text" height="1rem" width="80%" className="mt-3" /></div>)}</div>
      ) : error ? (
        <ErrorState title="Unable to load quizzes" message={error} onRetry={() => loadQuizzes(page)} />
      ) : quizzes.length === 0 ? (
        <EmptyState title="No quizzes yet" description={search ? 'Try a different search term.' : 'Published quizzes for your enrolled courses will appear here.'} icon={<InboxIcon className="h-12 w-12" />} action={search ? <Button variant="outline" onClick={() => setSearch('')}>Clear search</Button> : <Link to="/courses" className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Explore courses</Link>} />
      ) : (
        <div className="space-y-4">{quizzes.map((quiz) => { const state = getQuizState(quiz); return <article key={quiz._id} className="rounded-xl border border-border bg-surface p-5 transition hover:shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 flex-1 gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10"><FileTextIcon className="h-6 w-6 text-primary" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-semibold text-text">{quiz.title}</h2><Badge variant={state.variant}>{state.label}</Badge></div><p className="mt-1 truncate text-xs text-text-muted">{quiz.courseId?.title || 'Course N/A'} · {quiz.classId?.batchName || 'Class N/A'}</p>{quiz.description && <p className="mt-2 line-clamp-2 text-sm text-text-muted">{quiz.description}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted"><span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" />{quiz.durationMinutes} minutes</span><span className="flex items-center gap-1"><BookOpenIcon className="h-3.5 w-3.5" />{quiz.totalMarks} marks</span><span className="flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" />{quiz.attemptLimit} attempt{quiz.attemptLimit === 1 ? '' : 's'}</span></div><p className="mt-2 text-xs text-text-muted">Available {formatDate(quiz.startDate)} – {formatDate(quiz.endDate)}</p></div></div><Link to={`/student/quizzes/${quiz._id}`} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">View quiz</Link></div></article> })}</div>
      )}
      {!loading && meta && meta.totalPages > 1 && <div className="mt-6"><Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={(nextPage) => { loadQuizzes(nextPage); window.scrollTo({ top: 0, behavior: 'smooth' }) }} /></div>}
    </Container>
  )
}
