import { useState, useEffect } from 'react'
import { Badge, Skeleton, ErrorState, EmptyState, Container } from '@/components'
import { quizApi } from '@/services/api/quiz'
import { ClipboardListIcon } from '@/components/ui/icons'
import type { StudentQuiz, StudentQuizAttempt } from '@/types/quiz'

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getAttemptStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' | 'default' {
  switch (status) {
    case 'submitted':
      return 'success'
    case 'in_progress':
      return 'warning'
    case 'expired':
      return 'error'
    default:
      return 'default'
  }
}

export function StudentQuizResults() {
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([])
  const [attemptsMap, setAttemptsMap] = useState<Record<string, StudentQuizAttempt[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuizResults = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await quizApi.getQuizzes({ limit: 100 })
      const quizList = result.data || []
      setQuizzes(quizList)

      if (quizList.length === 0) {
        setAttemptsMap({})
        return
      }

      const attemptsPromises = quizList.map((quiz) =>
        quizApi.getMyAttempts(quiz._id).catch(() => [] as StudentQuizAttempt[])
      )

      const attemptsArrays = await Promise.all(attemptsPromises)

      const newAttemptsMap: Record<string, StudentQuizAttempt[]> = {}
      quizList.forEach((quiz, index) => {
        newAttemptsMap[quiz._id] = attemptsArrays[index] || []
      })

      setAttemptsMap(newAttemptsMap)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load quiz results.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuizResults()
  }, [])

  const quizzesWithAttempts = quizzes.filter((quiz) => {
    const attempts = attemptsMap[quiz._id] || []
    return attempts.length > 0
  })

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="80px" />
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Quiz Results</h1>
          <p className="mt-1 text-sm text-text-muted">View your quiz attempts and scores.</p>
        </div>
        <ErrorState title="Unable to load quiz results" message={error} onRetry={loadQuizResults} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Quiz Results</h1>
        <p className="mt-1 text-sm text-text-muted">View your quiz attempts and scores.</p>
      </div>

      {quizzesWithAttempts.length === 0 ? (
        <EmptyState
          title="No quiz results yet"
          description="Complete a quiz to see your results here."
          icon={<ClipboardListIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="space-y-4">
          {quizzesWithAttempts.map((quiz) => {
            const attempts = attemptsMap[quiz._id] || []
            const latestAttempt = attempts[0]

            return (
              <div key={quiz._id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text">{quiz.title}</h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {quiz.courseId?.title || 'N/A'} • {quiz.classId?.batchName || 'N/A'}
                    </p>
                  </div>
                  <Badge variant={latestAttempt?.passed ? 'success' : 'error'} className="shrink-0">
                    {latestAttempt?.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-background">
                      <tr>
                        <th className="px-3 py-2 text-xs font-medium text-text-muted">Attempt</th>
                        <th className="px-3 py-2 text-xs font-medium text-text-muted">Score</th>
                        <th className="px-3 py-2 text-xs font-medium text-text-muted">Percentage</th>
                        <th className="px-3 py-2 text-xs font-medium text-text-muted">Status</th>
                        <th className="px-3 py-2 text-xs font-medium text-text-muted">Started</th>
                        <th className="px-3 py-2 text-xs font-medium text-text-muted">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attempts.map((attempt) => (
                        <tr key={attempt._id} className="hover:bg-background transition-colors duration-150">
                          <td className="px-3 py-2 text-text">#{attempt.attemptNumber}</td>
                          <td className="px-3 py-2 text-text">{attempt.score} / {attempt.totalMarks}</td>
                          <td className="px-3 py-2 text-text">{attempt.percentage.toFixed(1)}%</td>
                          <td className="px-3 py-2">
                            <Badge variant={getAttemptStatusVariant(attempt.status)} className="capitalize">
                              {attempt.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-text-muted">{formatDate(attempt.startedAt)} {formatTime(attempt.startedAt)}</td>
                          <td className="px-3 py-2 text-text-muted">{attempt.submittedAt ? `${formatDate(attempt.submittedAt)} ${formatTime(attempt.submittedAt)}` : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
