import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Button,
  Badge,
  Skeleton,
  EmptyState,
  ErrorState,
  Modal,
  Input,
  TextArea,
  Select,
  FileUploadDropzone,
} from '@/components'

import { teacherApi } from '@/services/api/teacher'
import { getAvatarUrl } from '@/utils'
import { TeacherAssignmentForm } from './TeacherAssignmentForm'
import { TeacherQuizForm } from './TeacherQuizForm'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  MonitorIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  FileTextIcon,
  AlertCircleIcon,
} from '@/components/ui/icons'
import type {
  TeacherClass,
  TeacherEnrollment,
  TeacherAssignment,
  TeacherQuiz,
  TeacherLiveSession,
} from '@/types/teacher'

type ClassTab = 'live' | 'assignments' | 'quizzes' | 'materials' | 'notices' | 'attendance' | 'students'

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(time?: string) {
  if (!time) return 'N/A'
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function getStatusVariant(status?: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'ongoing':
    case 'active':
    case 'live':
      return 'success'
    case 'upcoming':
    case 'scheduled':
      return 'default'
    case 'completed':
    case 'published':
      return 'primary'
    case 'cancelled':
    case 'closed':
      return 'error'
    default:
      return 'default'
  }
}

export function TeacherClassDetails() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ClassTab>('live')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [classData, setClassData] = useState<TeacherClass | null>(null)
  const [enrollments, setEnrollments] = useState<TeacherEnrollment[]>([])
  const [activeLiveSession, setActiveLiveSession] = useState<TeacherLiveSession | null>(null)
  const [startingLive, setStartingLive] = useState(false)
  const [endingLive, setEndingLive] = useState(false)

  // Assignments & Quizzes
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null)
  const [openQuizModal, setOpenQuizModal] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<TeacherQuiz | null>(null)

  // Materials & Notices
  const [materials, setMaterials] = useState<any[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [openMaterialModal, setOpenMaterialModal] = useState(false)
  const [openNoticeModal, setOpenNoticeModal] = useState(false)
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', fileUrl: '', fileType: 'pdf' })
  const [noticeForm, setNoticeForm] = useState({ title: '', description: '', priority: 'medium' })
  const [savingMaterial, setSavingMaterial] = useState(false)
  const [savingNotice, setSavingNotice] = useState(false)

  // Attendance in Live Class
  const [studentStatuses, setStudentStatuses] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({})
  const [submittingAttendance, setSubmittingAttendance] = useState(false)
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadData = async () => {
    if (!classId) return
    setLoading(true)
    setError(null)
    try {
      const [classRes, enrollmentsRes, activeLiveRes, assignmentsRes, quizzesRes, materialsRes, noticesRes] =
        await Promise.all([
          teacherApi.getClassById(classId),
          teacherApi.getEnrollments(),
          teacherApi.getActiveClassLive(classId).catch(() => null),
          teacherApi.getAssignments({ classId }).catch(() => ({ data: [] })),
          teacherApi.getQuizzes({ classId }).catch(() => ({ data: [] })),
          teacherApi.getMaterials().catch(() => ({ data: [] })),
          teacherApi.getNotices().catch(() => ({ data: [] })),
        ])

      setClassData(classRes.data)
      setActiveLiveSession(activeLiveRes)

      const classEnrollments = (enrollmentsRes.data || []).filter(
        (e: any) => (e.classId?._id ? String(e.classId._id) : String(e.classId)) === String(classId)
      )
      setEnrollments(classEnrollments)

      // Initialize attendance statuses to 'present' for each student
      const initialStatuses: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {}
      classEnrollments.forEach((e: any) => {
        const sid = e.studentId?._id || e.studentId?.id || e.studentId
        if (sid) initialStatuses[sid] = 'present'
      })
      setStudentStatuses(initialStatuses)

      setAssignments(assignmentsRes.data || [])
      setQuizzes(quizzesRes.data || [])

      // Filter materials and notices for this class
      const classMaterials = (materialsRes.data || []).filter(
        (m: any) => (m.classId?._id || m.classId) === classId
      )
      setMaterials(classMaterials)

      const classNotices = (noticesRes.data || []).filter(
        (n: any) => (n.classId?._id || n.classId) === classId
      )
      setNotices(classNotices)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load class details.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceHistory = async () => {
    if (!classId) return
    setLoadingHistory(true)
    try {
      const history = await teacherApi.getClassAttendanceHistory(classId)
      setAttendanceHistory(history || [])
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [classId])

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceHistory()
    }
  }, [activeTab])

  // Live Class Handlers
  const handleStartLiveClass = async () => {
    if (!classId) return
    setStartingLive(true)
    try {
      const session = await teacherApi.startClassLive(classId)
      setActiveLiveSession(session)
      toast.success('Live class started successfully!')
      if (session?._id) {
        navigate(`/teacher/live-classes/${session._id}/classroom`)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start live class.'
      toast.error(msg)
    } finally {
      setStartingLive(false)
    }
  }


  const handleEndLiveClass = async () => {
    if (!classId) return
    setEndingLive(true)
    try {
      await teacherApi.endClassLive(classId)
      setActiveLiveSession(null)
      toast.success('Live class ended.')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to end live class.'
      toast.error(msg)
    } finally {
      setEndingLive(false)
    }
  }

  // Attendance Submit
  const handleSaveAttendance = async () => {
    if (!classId) return
    setSubmittingAttendance(true)
    try {
      const studentsPayload = Object.entries(studentStatuses).map(([studentId, status]) => ({
        studentId,
        status,
      }))

      await teacherApi.submitClassAttendance(classId, {
        attendanceDate: new Date().toISOString(),
        liveSessionId: activeLiveSession?._id,
        students: studentsPayload,
      })
      toast.success("Today's attendance saved successfully!")
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit attendance.'
      toast.error(msg)
    } finally {
      setSubmittingAttendance(false)
    }
  }

  const handleAutoMarkAllPresent = () => {
    const allPresent: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {}
    enrollments.forEach((e: any) => {
      const sid = e.studentId?._id || e.studentId?.id || e.studentId
      if (sid) allPresent[sid] = 'present'
    })
    setStudentStatuses(allPresent)
    toast.success('All students marked as Present.')
  }

  // Material Creation
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !classData) return
    setSavingMaterial(true)
    try {
      const newMat = await teacherApi.createMaterial({
        courseId: (classData.courseId as any)?._id || (classData.courseId as any),
        classId,
        title: materialForm.title,
        description: materialForm.description,
        fileUrl: materialForm.fileUrl,
        fileType: materialForm.fileType,
      })
      setMaterials((prev) => [newMat, ...prev])
      setOpenMaterialModal(false)
      setMaterialForm({ title: '', description: '', fileUrl: '', fileType: 'pdf' })
      toast.success('Material uploaded successfully')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload material')
    } finally {
      setSavingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    try {
      await teacherApi.deleteMaterial(id)
      setMaterials((prev) => prev.filter((m) => m._id !== id))
      toast.success('Material deleted')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete material')
    }
  }

  // Notice Creation
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !classData) return
    setSavingNotice(true)
    try {
      const newNotice = await teacherApi.createNotice({
        courseId: (classData.courseId as any)?._id || (classData.courseId as any),
        classId,
        title: noticeForm.title,
        description: noticeForm.description,
        priority: noticeForm.priority,
      })
      setNotices((prev) => [newNotice, ...prev])
      setOpenNoticeModal(false)
      setNoticeForm({ title: '', description: '', priority: 'medium' })
      toast.success('Notice posted successfully')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to post notice')
    } finally {
      setSavingNotice(false)
    }
  }

  const handleDeleteNotice = async (id: string) => {
    try {
      await teacherApi.deleteNotice(id)
      setNotices((prev) => prev.filter((n) => n._id !== id))
      toast.success('Notice deleted')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete notice')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" height="2rem" width="280px" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="100px" className="mb-2" />
              <Skeleton variant="text" height="2rem" width="60px" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !classData) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load class"
          message={error || 'Class not found.'}
          onRetry={loadData}
          secondaryAction={
            <Link to="/teacher/classes">
              <Button variant="primary">Back to Classes</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const courseTitle = classData.courseId?.title || 'Course'
  const scheduleText = `${classData.classDays?.join(', ') || 'TBD'} • ${formatTime(classData.startTime)} – ${formatTime(classData.endTime)}`

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-3">
        <Link
          to="/teacher/classes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to My Classes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">{classData.batchName}</h1>
          <Badge variant={getStatusVariant(classData.status)} className="capitalize">
            {classData.status || 'Active'}
          </Badge>
          {activeLiveSession && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Live Now
            </span>
          )}
        </div>
        <p className="text-sm text-text-muted">{courseTitle} • {scheduleText}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border bg-surface rounded-t-xl px-2">
        <nav className="-mb-px flex flex-wrap gap-1">
          {[
            { key: 'live', label: 'Live Class & Attendance', icon: <MonitorIcon className="h-4 w-4" /> },
            { key: 'assignments', label: `Assignments (${assignments.length})`, icon: <BookOpenIcon className="h-4 w-4" /> },
            { key: 'quizzes', label: `Quizzes (${quizzes.length})`, icon: <FileTextIcon className="h-4 w-4" /> },
            { key: 'materials', label: `Materials (${materials.length})`, icon: <BookOpenIcon className="h-4 w-4" /> },
            { key: 'notices', label: `Notices (${notices.length})`, icon: <AlertCircleIcon className="h-4 w-4" /> },
            { key: 'attendance', label: 'Attendance History', icon: <CalendarIcon className="h-4 w-4" /> },
            { key: 'students', label: `Enrolled Students (${enrollments.length})`, icon: <UsersIcon className="h-4 w-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ClassTab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:border-border hover:text-text'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* TAB CONTENT: Live Class & Live Attendance */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Live Meeting Hero Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-r from-surface to-background p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📹</span>
                  <h2 className="text-xl font-bold text-text">Direct Live Classroom</h2>
                </div>
                <p className="text-sm text-text-muted max-w-xl leading-relaxed">
                  Class schedule time: <span className="font-semibold text-primary">{scheduleText}</span>. Click <strong className="text-text font-semibold">"Start Live Class"</strong> to begin the live session. Enrolled students will be able to join once you start the class.
                </p>


                <div className="flex flex-wrap gap-4 pt-1 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    {classData.classDays?.join(', ') || 'Scheduled Days'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 text-primary" />
                    {formatTime(classData.startTime)} - {formatTime(classData.endTime)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="h-4 w-4 text-primary" />
                    {enrollments.length} Enrolled Students
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {activeLiveSession ? (
                  <>
                    <Link to={`/teacher/live-classes/${activeLiveSession._id}/classroom`}>
                      <Button variant="primary" className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                        <MonitorIcon className="h-4 w-4" />
                        Enter Live Classroom
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-error border-error/30 hover:bg-error/10"
                      onClick={handleEndLiveClass}
                      loading={endingLive}
                    >
                      End Live Class
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25"
                    onClick={handleStartLiveClass}
                    loading={startingLive}
                  >
                    <MonitorIcon className="h-5 w-5" />
                    Start Live Class
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Live Attendance Roll Call Box */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text">Today's Class Attendance</h3>
                <p className="text-xs text-text-muted">
                  Mark attendance for students during or after the live session.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAutoMarkAllPresent}>
                  Auto-Mark All Present
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAttendance}
                  loading={submittingAttendance}
                  className="gap-1.5"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Save Attendance
                </Button>
              </div>
            </div>

            {enrollments.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-muted">
                No students enrolled in this class yet.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {enrollments.map((enr: any) => {
                  const student = enr.studentId
                  const sid = student?._id || student?.id || student
                  const currentStatus = studentStatuses[sid] || 'present'

                  return (
                    <div key={enr._id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden">
                          {student?.avatar ? (
                            <img src={getAvatarUrl(student.avatar)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            student?.fullName?.charAt(0).toUpperCase() || 'S'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text">{student?.fullName || 'Student'}</p>
                          <p className="text-xs text-text-muted">{student?.email || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1.5">
                        {(['present', 'absent', 'late', 'excused'] as const).map((st) => {
                          const isSelected = currentStatus === st
                          const styles = {
                            present: isSelected ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
                            absent: isSelected ? 'bg-rose-600 text-white font-bold' : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20',
                            late: isSelected ? 'bg-amber-600 text-white font-bold' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
                            excused: isSelected ? 'bg-slate-700 text-white font-bold' : 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20',
                          }[st]

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setStudentStatuses((prev) => ({ ...prev, [sid]: st }))}
                              className={`rounded-lg px-2.5 py-1 text-xs capitalize transition-all ${styles}`}
                            >
                              {st}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">Class Assignments</h2>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setSelectedAssignment(null)
                setOpenAssignmentModal(true)
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Create Assignment
            </Button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments created yet"
              description="Create homework, projects or assignments for this class."
              icon={<BookOpenIcon className="h-10 w-10" />}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedAssignment(null)
                    setOpenAssignmentModal(true)
                  }}
                >
                  Create First Assignment
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text text-base">{assignment.title}</h3>
                    <Badge variant={getStatusVariant(assignment.status)} className="capitalize">
                      {assignment.status}
                    </Badge>
                  </div>
                  {assignment.description && (
                    <p className="text-xs text-text-muted line-clamp-2">{assignment.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                    <span>Total Marks: {assignment.totalMarks}</span>
                    <Link
                      to={`/teacher/assignments/${assignment._id}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      View Submissions →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Quizzes */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">Class Quizzes</h2>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setSelectedQuiz(null)
                setOpenQuizModal(true)
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Create Quiz
            </Button>
          </div>

          {quizzes.length === 0 ? (
            <EmptyState
              title="No quizzes created yet"
              description="Create tests and quizzes with multiple-choice questions."
              icon={<FileTextIcon className="h-10 w-10" />}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedQuiz(null)
                    setOpenQuizModal(true)
                  }}
                >
                  Create First Quiz
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text text-base">{quiz.title}</h3>
                    <Badge variant={getStatusVariant(quiz.status)} className="capitalize">
                      {quiz.status}
                    </Badge>
                  </div>
                  {quiz.description && (
                    <p className="text-xs text-text-muted line-clamp-2">{quiz.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
                    <span>Duration: {quiz.durationMinutes} min</span>
                    <span>Marks: {quiz.totalMarks}</span>
                    <Link
                      to={`/teacher/quizzes/${quiz._id}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      Manage Questions →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Materials */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">Study Materials & Lecture Notes</h2>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => setOpenMaterialModal(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Upload Material
            </Button>
          </div>

          {materials.length === 0 ? (
            <EmptyState
              title="No materials uploaded"
              description="Upload lecture notes, documents, and reference files for this class."
              icon={<BookOpenIcon className="h-10 w-10" />}
              action={
                <Button variant="primary" size="sm" onClick={() => setOpenMaterialModal(true)}>
                  Upload First Material
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {materials.map((mat) => (
                <div key={mat._id} className="rounded-xl border border-border bg-surface p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text text-base">{mat.title}</h3>
                    <button
                      onClick={() => handleDeleteMaterial(mat._id)}
                      className="text-text-muted hover:text-error transition-colors p-1"
                      title="Delete Material"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {mat.description && <p className="text-xs text-text-muted">{mat.description}</p>}
                  {mat.fileUrl && (
                    <div className="pt-2">
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        Download / Open File ↗
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Notices */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Class Notices & Announcements</h2>
              <p className="text-xs text-text-muted">Post announcements and updates directly to all students in this class.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => setOpenNoticeModal(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Post Notice (Modal)
            </Button>
          </div>

          {/* Quick Notice Composer Card Directly Inside Tab */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-primary" />
              Write & Publish Notice
            </h3>
            <form onSubmit={handleCreateNotice} className="space-y-3">
              <Input
                id="inline-notice-title"
                label="Notice Title"
                required
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="e.g. Class Rescheduled, Quiz Reminder, or Holiday Notice"
              />
              <TextArea
                id="inline-notice-desc"
                label="Notice Description / Announcement"
                required
                value={noticeForm.description}
                onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })}
                placeholder="Type your notice message here..."
                rows={3}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="w-full sm:w-56">
                  <Select
                    id="inline-notice-priority"
                    label="Priority"
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    options={[
                      { value: 'low', label: 'Low (Informative)' },
                      { value: 'medium', label: 'Medium (Standard)' },
                      { value: 'high', label: 'High Priority (Urgent)' },
                    ]}
                  />
                </div>
                <Button
                  variant="primary"
                  type="submit"
                  loading={savingNotice}
                  disabled={!noticeForm.title.trim() || !noticeForm.description.trim()}
                  className="mt-2 sm:mt-5"
                >
                  Publish Notice
                </Button>
              </div>
            </form>
          </div>

          {notices.length === 0 ? (
            <EmptyState
              title="No notices posted yet"
              description="Write a notice above to post announcements, schedule changes, or exam reminders."
              icon={<AlertCircleIcon className="h-10 w-10" />}
            />
          ) : (

            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice._id} className="rounded-xl border border-border bg-surface p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text text-base">{notice.title}</h3>
                      <Badge
                        variant={notice.priority === 'high' ? 'error' : notice.priority === 'medium' ? 'warning' : 'default'}
                        className="capitalize text-xs"
                      >
                        {notice.priority || 'Normal'}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleDeleteNotice(notice._id)}
                      className="text-text-muted hover:text-error transition-colors p-1"
                      title="Delete Notice"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-text-muted whitespace-pre-wrap">{notice.description || notice.content}</p>
                  <p className="text-[11px] text-text-muted pt-1">{formatDate(notice.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text">Attendance Records History</h2>

          {loadingHistory ? (
            <div className="space-y-2">
              <Skeleton variant="text" height="2rem" />
              <Skeleton variant="text" height="2rem" />
              <Skeleton variant="text" height="2rem" />
            </div>
          ) : attendanceHistory.length === 0 ? (
            <EmptyState
              title="No attendance records found"
              description="Attendance records will appear here as you take attendance for live classes."
              icon={<CalendarIcon className="h-10 w-10" />}
            />
          ) : (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background/50 text-xs font-semibold text-text-muted">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceHistory.map((rec) => (
                    <tr key={rec._id} className="hover:bg-background/30 transition-colors">
                      <td className="p-3 font-medium text-text">{formatDate(rec.attendanceDate)}</td>
                      <td className="p-3 text-text">{rec.studentId?.fullName || 'Student'}</td>
                      <td className="p-3 text-text-muted text-xs">{rec.studentId?.email || 'N/A'}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            rec.status === 'present'
                              ? 'success'
                              : rec.status === 'absent'
                              ? 'error'
                              : rec.status === 'late'
                              ? 'warning'
                              : 'default'
                          }
                          className="capitalize text-xs"
                        >
                          {rec.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Students */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">Enrolled Students ({enrollments.length})</h2>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState
              title="No students enrolled yet"
              description="Students enrolled in this class will be listed here."
              icon={<UsersIcon className="h-10 w-10" />}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enr) => {
                const s = enr.studentId
                return (
                  <div key={enr._id} className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                      {s?.avatar ? (
                        <img src={getAvatarUrl(s.avatar)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        s?.fullName?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text truncate">{s?.fullName || 'Student'}</p>
                      <p className="text-xs text-text-muted truncate">{s?.email || 'N/A'}</p>
                      {s?.phone && <p className="text-[11px] text-text-muted truncate">📞 {s.phone}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create Assignment */}
      <TeacherAssignmentForm
        open={openAssignmentModal}
        onClose={() => setOpenAssignmentModal(false)}
        onSuccess={() => {
          setOpenAssignmentModal(false)
          loadData()
        }}
        assignment={selectedAssignment}
        defaultClassId={classId}
        defaultCourseId={(classData.courseId as any)?._id || (classData.courseId as any)}
      />

      {/* MODAL: Create Quiz */}
      <TeacherQuizForm
        open={openQuizModal}
        onClose={() => setOpenQuizModal(false)}
        onSuccess={() => {
          setOpenQuizModal(false)
          loadData()
        }}
        quiz={selectedQuiz}
        defaultClassId={classId}
        defaultCourseId={(classData.courseId as any)?._id || (classData.courseId as any)}
      />

      {/* MODAL: Upload Material */}
      <Modal open={openMaterialModal} onClose={() => setOpenMaterialModal(false)} title="Upload Study Material">
        <form onSubmit={handleCreateMaterial} className="space-y-4">
          <Input
            label="Material Title"
            required
            value={materialForm.title}
            onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
            placeholder="e.g. Lecture 1 - Introduction Slides"
          />
          <TextArea
            label="Description (Optional)"
            value={materialForm.description}
            onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
            placeholder="Brief details about this material"
          />
          <div className="space-y-2">
            <FileUploadDropzone
              label="Upload Material File (Drag & Drop)"
              hint="Directly upload PDF, Slides, Docs, Images, or Zip up to 25MB"
              folder="eduflow/materials"
              value={materialForm.fileUrl}
              onChange={(url, detectedType) =>
                setMaterialForm({
                  ...materialForm,
                  fileUrl: url,
                  ...(detectedType ? { fileType: detectedType } : {}),
                })
              }
              onRemove={() => setMaterialForm({ ...materialForm, fileUrl: '' })}
            />
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Or Enter File / Resource URL
              </label>
              <Input
                value={materialForm.fileUrl}
                onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
                placeholder="https://... or link to document"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setOpenMaterialModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={savingMaterial}>
              Save Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Post Notice */}
      <Modal open={openNoticeModal} onClose={() => setOpenNoticeModal(false)} title="Post Class Notice">
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <Input
            id="modal-notice-title"
            label="Notice Title"
            required
            autoFocus
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
            placeholder="e.g. Class Rescheduled or Quiz Reminder"
          />
          <TextArea
            id="modal-notice-description"
            label="Notice Description / Announcement"
            required
            value={noticeForm.description}
            onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })}
            placeholder="Type notice message here..."
            rows={4}
          />
          <Select
            id="modal-notice-priority"
            label="Priority"
            value={noticeForm.priority}
            onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High Priority' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setOpenNoticeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={savingNotice}>
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
