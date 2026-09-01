import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Container, EmptyState, ErrorState, Skeleton } from '@/components'
import { quizApi } from '@/services/api/quiz'
import type { StudentQuiz, StudentQuizAttempt, StudentQuizQuestion } from '@/types/quiz'
import { BookOpenIcon, CheckCircleIcon, ChevronLeftIcon, ClockIcon, FileTextIcon } from '@/components/ui/icons'
import { formatDate, formatDateTime } from '@/utils'
import { toast } from 'react-hot-toast'

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function QuizDetails() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<StudentQuiz | null>(null)
  const [attempts, setAttempts] = useState<StudentQuizAttempt[]>([])
  const [attempt, setAttempt] = useState<StudentQuizAttempt | null>(null)
  const [questions, setQuestions] = useState<StudentQuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const loadQuiz = useCallback(async () => {
    if (!quizId) return
    setLoading(true)
    setError(null)
    try {
      const [quizData, attemptsData] = await Promise.all([quizApi.getQuizById(quizId), quizApi.getMyAttempts(quizId)])
      setQuiz(quizData)
      setAttempts(attemptsData)
      try {
        const currentAttempt = await quizApi.getCurrentAttempt(quizId)
        setAttempt(currentAttempt)
        setQuestions(await quizApi.getQuestions(quizId))
      } catch (currentError: any) {
        if (currentError?.response?.status !== 404) throw currentError
        setAttempt(null)
      }
    } catch (err: any) {
      setError(err?.response?.status === 404 ? 'This quiz was not found or is no longer available.' : err?.response?.data?.message || 'Unable to load this quiz.')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => { loadQuiz() }, [loadQuiz])

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') {
      setRemaining(null)
      return
    }
    const update = () => setRemaining(new Date(attempt.expiresAt).getTime() - Date.now())
    update()
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now())
      update()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [attempt])

  const latestResult = useMemo(() => attempts.find((item) => item.status === 'submitted'), [attempts])
  const canStart = quiz && quiz.status === 'published' && !attempt && (!Number.isFinite(new Date(quiz.startDate).getTime()) || currentTime >= new Date(quiz.startDate).getTime()) && (!Number.isFinite(new Date(quiz.endDate).getTime()) || currentTime <= new Date(quiz.endDate).getTime())

  const startAttempt = async () => {
    if (!quizId || starting) return
    setStarting(true)
    setError(null)
    try {
      const nextAttempt = await quizApi.startAttempt(quizId)
      setAttempt(nextAttempt)
      setQuestions(await quizApi.getQuestions(quizId))
      setAnswers({})
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to start this quiz.'
      setError(message)
      toast.error(message)
    } finally {
      setStarting(false)
    }
  }

  const submitAttempt = async () => {
    if (!quizId || !attempt || submitting || attempt.status !== 'in_progress') return
    const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }))
    if (payload.length === 0) {
      toast.error('Select at least one answer before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const result = await quizApi.submitAttempt(quizId, attempt._id, payload)
      setAttempt(result)
      setAttempts((previous) => [result, ...previous.filter((item) => item._id !== result._id)])
      toast.success('Quiz submitted successfully.')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to submit this quiz.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Container className="py-8"><Skeleton variant="text" height="1rem" width="180px" /><Skeleton variant="text" height="2.25rem" width="70%" className="mt-4" /><Skeleton variant="rect" height="18rem" className="mt-6" /></Container>
  if (error && !quiz) return <Container className="py-8"><div className="mb-4"><button type="button" onClick={() => navigate('/student/quizzes')} className="inline-flex items-center gap-1 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronLeftIcon className="h-4 w-4" />Back to quizzes</button></div><ErrorState title="Unable to load quiz" message={error} onRetry={loadQuiz} /></Container>
  if (!quiz) return null

  const quizEnded = Number.isFinite(new Date(quiz.endDate).getTime()) && currentTime > new Date(quiz.endDate).getTime()
  const timeExpired = remaining !== null && remaining <= 0

  return (
    <Container className="py-8">
      <div className="mb-4"><button type="button" onClick={() => navigate('/student/quizzes')} className="inline-flex items-center gap-1 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronLeftIcon className="h-4 w-4" />Back to quizzes</button></div>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="primary">{quiz.courseId?.title || 'Course N/A'}</Badge><Badge variant={quiz.status === 'published' ? 'success' : 'neutral'} className="capitalize">{quiz.status}</Badge></div>
        <h1 className="mt-3 break-words text-2xl font-bold text-text sm:text-3xl">{quiz.title}</h1>
        <p className="mt-2 text-sm text-text-muted">{quiz.description || 'No description provided.'}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info icon={<ClockIcon className="h-4 w-4 text-primary" />} label="Duration" value={`${quiz.durationMinutes} minutes`} /><Info icon={<BookOpenIcon className="h-4 w-4 text-primary" />} label="Total marks" value={`${quiz.totalMarks}`} /><Info icon={<FileTextIcon className="h-4 w-4 text-primary" />} label="Attempts" value={`${quiz.attemptLimit}`} /><Info icon={<ClockIcon className="h-4 w-4 text-primary" />} label="Available" value={`${formatDate(quiz.startDate)} – ${formatDate(quiz.endDate)}`} /></div>
        {quiz.instructions && <div className="mt-6 rounded-xl border border-border bg-background p-4"><h2 className="text-sm font-semibold text-text">Instructions</h2><p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">{quiz.instructions}</p></div>}

        {error && quiz && <div className="mt-4 rounded-lg border border-error/20 bg-error/5 p-3 text-sm text-error">{error}</div>}

        {attempt?.status === 'in_progress' ? (
          <div className="mt-8"><div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4"><div><p className="text-sm font-semibold text-text">Attempt {attempt.attemptNumber}</p><p className="text-xs text-text-muted">Started {formatDateTime(attempt.startedAt)}</p></div><span className={`font-mono text-sm font-semibold ${timeExpired ? 'text-error' : 'text-text'}`} aria-live="polite">{timeExpired ? 'Time expired' : `Time left ${formatRemaining(remaining ?? 0)}`}</span></div>{questions.length === 0 ? <EmptyState title="Questions are not available yet" description="Your instructor has not added questions to this quiz." /> : <div className="space-y-5">{questions.map((question, index) => <fieldset key={question._id} className="rounded-xl border border-border bg-background p-4 sm:p-5" disabled={timeExpired || submitting}><legend className="max-w-full px-1 text-sm font-semibold text-text">{index + 1}. {question.questionText} <span className="font-normal text-text-muted">({question.marks} mark{question.marks === 1 ? '' : 's'})</span></legend><div className="mt-3 space-y-2">{question.options.map((option) => <label key={option.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 text-sm text-text transition hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input type="radio" name={question._id} value={option.key} checked={answers[question._id] === option.key} onChange={() => setAnswers((previous) => ({ ...previous, [question._id]: option.key }))} className="mt-0.5 accent-primary" />{option.text}</label>)}</div></fieldset>)}</div>}<div className="mt-6 flex justify-end"><Button onClick={submitAttempt} loading={submitting} disabled={timeExpired || questions.length === 0}>Submit quiz</Button></div></div>
        ) : (
          <div className="mt-8 rounded-xl border border-border bg-background p-5">{latestResult ? <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircleIcon className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="text-sm font-semibold text-text">Latest result</h2><p className="mt-1 text-sm text-text-muted">{latestResult.score}/{latestResult.totalMarks} marks · {latestResult.percentage}% · {latestResult.passed ? 'Passed' : 'Not passed'}</p></div></div>{canStart && <Button variant="outline" onClick={startAttempt} loading={starting}>Try again</Button>}</div> : <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-text">Ready to begin?</h2><p className="mt-1 text-sm text-text-muted">You have {quiz.attemptLimit} attempt{quiz.attemptLimit === 1 ? '' : 's'} available. Your timer starts when you begin.</p></div><Button onClick={startAttempt} loading={starting} disabled={!canStart}>{quizEnded ? 'Quiz closed' : canStart ? 'Start quiz' : 'Not started yet'}</Button></div>}</div>
        )}
      </div>
      {attempts.length > 0 && <div className="mt-8"><h2 className="text-lg font-semibold text-text">Attempt history</h2><div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-background text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-4 py-3">Attempt</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Submitted</th></tr></thead><tbody className="divide-y divide-border">{attempts.map((item) => <tr key={item._id}><td className="px-4 py-3 text-text">#{item.attemptNumber}</td><td className="px-4 py-3 capitalize text-text-muted">{item.status.replace('_', ' ')}</td><td className="px-4 py-3 text-text">{item.status === 'submitted' ? `${item.score}/${item.totalMarks} (${item.percentage}%)` : '—'}</td><td className="px-4 py-3 text-text-muted">{item.submittedAt ? formatDateTime(item.submittedAt) : '—'}</td></tr>)}</tbody></table></div></div>}
    </Container>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-background p-3"><div className="flex items-center gap-2 text-xs text-text-muted">{icon}{label}</div><p className="mt-1 text-sm font-medium text-text">{value}</p></div>
}
