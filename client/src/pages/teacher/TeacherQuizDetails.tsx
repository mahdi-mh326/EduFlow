import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState } from '@/components'
import { teacherApi } from '@/services/api/teacher'
import {
  BookOpenIcon,
  UsersIcon,
  ChevronLeftIcon,
  InboxIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  XIcon,
} from '@/components/ui/icons'
import type { TeacherQuiz, TeacherQuizAttempt } from '@/types/teacher'

function formatDateTime(dateString: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'default'
    case 'closed':
      return 'warning'
    default:
      return 'default'
  }
}

export function TeacherQuizDetails() {
  const { quizId } = useParams<{ quizId: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<TeacherQuiz | null>(null)
  const [attempts, setAttempts] = useState<TeacherQuizAttempt[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)

  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    marks: 1,
    order: 1,
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ],
    correctAnswer: 'A',
  })

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [quizData, attemptsData, questionsData] = await Promise.all([
        teacherApi.getQuizById(quizId || ''),
        teacherApi.getQuizAttempts(quizId || ''),
        teacherApi.getQuestions(quizId || ''),
      ])
      setQuiz(quizData as any)
      setAttempts(attemptsData.data || [])
      setQuestions(questionsData || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load quiz details.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [quizId])

  const openAddQuestion = () => {
    setEditingQuestion(null)
    setQuestionForm({
      questionText: '',
      marks: 1,
      order: questions.length + 1,
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctAnswer: 'A',
    })
    setIsQuestionModalOpen(true)
  }

  const openEditQuestion = (q: any) => {
    setEditingQuestion(q)
    setQuestionForm({
      questionText: q.questionText || '',
      marks: q.marks || 1,
      order: q.order || 1,
      options: q.options && q.options.length >= 2 ? q.options : [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
      ],
      correctAnswer: q.correctAnswer || 'A',
    })
    setIsQuestionModalOpen(true)
  }

  const handleOptionTextChange = (index: number, text: string) => {
    const next = [...questionForm.options]
    next[index].text = text
    setQuestionForm({ ...questionForm, options: next })
  }

  const handleAddOption = () => {
    const nextKey = String.fromCharCode(65 + questionForm.options.length)
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { key: nextKey, text: '' }],
    })
  }

  const handleRemoveOption = (index: number) => {
    if (questionForm.options.length <= 2) {
      toast.error('A question must have at least 2 options.')
      return
    }
    const next = questionForm.options.filter((_, i) => i !== index).map((opt, i) => ({
      key: String.fromCharCode(65 + i),
      text: opt.text,
    }))
    let nextCorrect = questionForm.correctAnswer
    if (!next.some((o) => o.key === nextCorrect)) {
      nextCorrect = next[0].key
    }
    setQuestionForm({ ...questionForm, options: next, correctAnswer: nextCorrect })
  }

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quizId) return

    if (!questionForm.questionText.trim()) {
      toast.error('Question text is required.')
      return
    }

    if (questionForm.options.some((o) => !o.text.trim())) {
      toast.error('Please fill in all option text fields.')
      return
    }

    setSavingQuestion(true)
    try {
      if (editingQuestion) {
        await teacherApi.updateQuestion(quizId, editingQuestion._id, questionForm)
        toast.success('Question updated successfully')
      } else {
        await teacherApi.createQuestion(quizId, questionForm)
        toast.success('Question added successfully')
      }
      setIsQuestionModalOpen(false)
      const freshQuestions = await teacherApi.getQuestions(quizId)
      setQuestions(freshQuestions || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save question.'
      toast.error(message)
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!quizId) return
    if (!confirm('Are you sure you want to delete this question?')) return

    setDeletingQuestionId(questionId)
    try {
      await teacherApi.deleteQuestion(quizId, questionId)
      toast.success('Question deleted')
      setQuestions((prev) => prev.filter((q) => q._id !== questionId))
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete question.'
      toast.error(message)
    } finally {
      setDeletingQuestionId(null)
    }
  }

  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="text" height="1.5rem" width="120px" className="mb-2" />
          <Skeleton variant="text" height="2rem" width="300px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="100px" className="mb-3" />
              <Skeleton variant="text" height="2rem" width="60px" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <Skeleton variant="text" height="1.5rem" width="180px" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height="60px" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load quiz"
          message={error || 'Quiz not found.'}
          onRetry={loadData}
          secondaryAction={
            <Link to={quiz?.classId?._id ? `/teacher/classes/${quiz.classId._id}` : '/teacher/classes'}>
              <Button variant="primary">Back to Class</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const backUrl = quiz?.classId?._id ? `/teacher/classes/${quiz.classId._id}` : '/teacher/classes'

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link to={backUrl} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Class Details
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">{quiz.title}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {quiz.courseId?.title || 'Course'} • {quiz.classId?.batchName || 'Class'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status" value={quiz.status || 'N/A'} icon={<FileTextIcon className="h-5 w-5 text-primary" />} badge />
        <StatCard label="Questions" value={questions.length.toString()} icon={<BookOpenIcon className="h-5 w-5 text-secondary" />} />
        <StatCard label="Attempts" value={attempts.length.toString()} icon={<UsersIcon className="h-5 w-5 text-accent" />} />
        <StatCard label="Avg Score" value={`${avgScore}%`} icon={<CheckCircleIcon className="h-5 w-5 text-success" />} />
      </div>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Quiz Details</h2>
        <div className="space-y-4">
          {quiz.description && (
            <div>
              <p className="text-xs text-text-muted mb-1">Description</p>
              <p className="text-sm text-text whitespace-pre-wrap">{quiz.description}</p>
            </div>
          )}
          {quiz.instructions && (
            <div>
              <p className="text-xs text-text-muted mb-1">Instructions</p>
              <p className="text-sm text-text whitespace-pre-wrap">{quiz.instructions}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-muted">Duration</p>
              <p className="font-medium text-text">{quiz.durationMinutes} minutes</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Total Marks</p>
              <p className="font-medium text-text">{quiz.totalMarks}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Passing Marks</p>
              <p className="font-medium text-text">{quiz.passingMarks}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Attempt Limit</p>
              <p className="font-medium text-text">{quiz.attemptLimit}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Start Date</p>
              <p className="font-medium text-text">{formatDateTime(quiz.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">End Date</p>
              <p className="font-medium text-text">{formatDateTime(quiz.endDate)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">Quiz Questions</h2>
            <p className="text-xs text-text-muted">{questions.length} questions in this quiz</p>
          </div>
          <Button variant="primary" size="sm" onClick={openAddQuestion}>
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <EmptyState
            title="No questions yet"
            description="Add multiple choice questions for students to answer."
            icon={<BookOpenIcon className="h-12 w-12" />}
            action={
              <Button variant="primary" size="sm" onClick={openAddQuestion}>
                Add First Question
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q._id} className="rounded-xl border border-border bg-background p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-text">{q.questionText}</h3>
                      <Badge variant="neutral" className="text-xs">{q.marks} mark{q.marks === 1 ? '' : 's'}</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options?.map((opt: any) => {
                        const isCorrect = opt.key === q.correctAnswer
                        return (
                          <div
                            key={opt.key}
                            className={`flex items-center justify-between rounded-lg border p-2.5 text-xs ${
                              isCorrect
                                ? 'border-success/50 bg-success/10 text-success font-medium'
                                : 'border-border bg-surface text-text'
                            }`}
                          >
                            <span><strong className="mr-1">{opt.key}.</strong> {opt.text}</span>
                            {isCorrect && <Badge variant="success" className="text-[10px]">Correct</Badge>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditQuestion(q)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteQuestion(q._id)}
                      disabled={deletingQuestionId === q._id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Student Attempts Section */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Student Attempts</h2>
          <span className="text-xs text-text-muted">{attempts.length} total</span>
        </div>

        {attempts.length === 0 ? (
          <EmptyState
            title="No attempts yet"
            description="Student quiz attempts will appear here."
            icon={<InboxIcon className="h-12 w-12" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] divide-y divide-border">
              <thead>
                <tr className="bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Attempt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Percentage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {attempts.map((attempt) => (
                  <tr key={attempt._id} className="hover:bg-background transition-colors duration-150">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {attempt.studentId?.fullName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text truncate">{attempt.studentId?.fullName}</p>
                          <p className="text-xs text-text-muted truncate">{attempt.studentId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text">#{attempt.attemptNumber}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getAttemptStatusVariant(attempt.status)} className="capitalize">
                        {attempt.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text">
                      {attempt.score} / {attempt.totalMarks}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text">{attempt.percentage}%</span>
                        {attempt.passed ? (
                          <CheckCircleIcon className="h-4 w-4 text-success" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-error" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{formatDateTime(attempt.submittedAt || attempt.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text mb-4">
              {editingQuestion ? 'Edit Question' : 'Add MCQ Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Question Text *
                </label>
                <textarea
                  required
                  rows={2}
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  placeholder="Type the question here..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Order *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={questionForm.order}
                    onChange={(e) => setQuestionForm({ ...questionForm, order: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-muted">Options *</label>
                  {questionForm.options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {questionForm.options.map((opt, idx) => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background border border-border text-xs font-bold text-text">
                        {opt.key}
                      </span>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Option ${opt.key} text`}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      {questionForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-text-muted hover:text-error p-1 transition-colors"
                          title="Remove option"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Correct Answer *
                </label>
                <select
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {questionForm.options.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      Option {opt.key} ({opt.text || 'No text'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsQuestionModalOpen(false)}
                  disabled={savingQuestion}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={savingQuestion}
                >
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, badge }: { label: string; value: string; icon: React.ReactNode; badge?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
          {icon}
        </div>
        <div>
          <p className="text-xs text-text-muted">{label}</p>
          {badge ? (
            <Badge variant={getStatusVariant(value)} className="capitalize mt-1">{value}</Badge>
          ) : (
            <p className="text-xl font-bold text-text">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getAttemptStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'submitted':
      return 'success'
    case 'in_progress':
      return 'default'
    case 'expired':
      return 'error'
    default:
      return 'default'
  }
}

