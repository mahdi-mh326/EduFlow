import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Button,
  Badge,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@/components'
import { courseApi } from '@/services/api/course'
import { assignmentApi } from '@/services/api/assignment'
import { quizApi } from '@/services/api/quiz'
import { studentApi } from '@/services/api/student'
import { getAvatarUrl } from '@/utils'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  MonitorIcon,
  CheckCircleIcon,
  FileTextIcon,
  AlertCircleIcon,
  ClipboardListIcon,
} from '@/components/ui/icons'
import { materialApi } from '@/services/api/material'
import type { Material } from '@/types/material'
import type { Assignment } from '@/types/assignment'
import type { StudentQuiz } from '@/types/quiz'
import type { StudentLiveSession, StudentNotice, StudentAttendance } from '@/types/student'


type StudentClassTab = 'live' | 'assignments' | 'quizzes' | 'materials' | 'notices' | 'attendance' | 'info'

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

export function StudentClassDetails() {
  const { classId } = useParams<{ classId: string }>()
  const [activeTab, setActiveTab] = useState<StudentClassTab>('live')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cls, setCls] = useState<any | null>(null)
  const [liveSessions, setLiveSessions] = useState<StudentLiveSession[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [notices, setNotices] = useState<StudentNotice[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendance[]>([])

  const loadClassData = async () => {
    if (!classId) return
    setLoading(true)
    setError(null)

    try {
      const results = await Promise.allSettled([
        courseApi.getClassById(classId),
        studentApi.getLiveSessions(),
        assignmentApi.getAssignments({ classId }),
        quizApi.getQuizzes({ limit: 50 }),
        materialApi.getMaterials({ classId }),
        studentApi.getNotices(),
        studentApi.getAttendance({ limit: 100 }),
      ])

      const [classRes, sessionsRes, assignRes, quizRes, materialRes, noticeRes, attendanceRes] = results

      if (classRes.status === 'fulfilled') {
        setCls(classRes.value)
      } else {
        throw new Error('Unable to load class details.')
      }

      if (sessionsRes.status === 'fulfilled') {
        const mySessions = (sessionsRes.value || []).filter((s) => {
          const cId = (s.classId as any)?._id || (s.classId as any)?.id || s.classId
          return String(cId) === String(classId)
        })
        setLiveSessions(mySessions)
      }

      if (assignRes.status === 'fulfilled') {
        setAssignments(assignRes.value.data || [])
      }

      if (quizRes.status === 'fulfilled') {
        const classQuizzes = (quizRes.value.data || []).filter((q) => {
          const cId = (q.classId as any)?._id || (q.classId as any)?.id || q.classId
          return String(cId) === String(classId)
        })
        setQuizzes(classQuizzes)
      }

      if (materialRes.status === 'fulfilled') {
        setMaterials(materialRes.value || [])
      }

      if (noticeRes.status === 'fulfilled') {
        const classNotices = (noticeRes.value || []).filter((n) => {
          const cId = (n.classId as any)?._id || (n.classId as any)?.id || n.classId
          return !cId || String(cId) === String(classId)
        })
        setNotices(classNotices)
      }


      if (attendanceRes.status === 'fulfilled') {
        const classAttendance = (attendanceRes.value.data || []).filter((a: any) => {
          const cId = a.class?._id || a.class?.id || a.class || a.classId?._id || a.classId
          return String(cId) === String(classId)
        })
        setAttendanceRecords(classAttendance)
      }

    } catch (err: any) {
      const message = err?.message || 'Failed to load class details.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassData()
  }, [classId])

  const activeLiveSession = liveSessions.find((s) => s.status === 'live')
  const isClassLive = Boolean(activeLiveSession)
  const teacher = (cls as any)?.teacherId

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" height="2rem" width="200px" />
        <Skeleton variant="rect" height="180px" className="rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="80px" className="rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !cls) {
    return (
      <div className="py-12">
        <ErrorState
          title="Class Details Unavailable"
          message={error || 'Class not found.'}
          onRetry={loadClassData}
          secondaryAction={
            <Link to="/student/classes">
              <Button variant="outline">Back to My Classes</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Back Link & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/classes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to My Classes
        </Link>
        <Badge variant={getStatusVariant(cls.status)} className="capitalize text-xs">
          {cls.status}
        </Badge>
      </div>

      {/* Class Hero Banner */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {(cls.courseId as any)?.title || 'Course'}
            </span>
            <h1 className="text-2xl font-extrabold text-text sm:text-3xl">
              {cls.batchName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
              <span className="inline-flex items-center gap-1.5 font-medium text-text">
                <ClockIcon className="h-4 w-4 text-primary" />
                {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {cls.classDays?.join(', ') || 'Days TBD'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4 text-primary" />
                {cls.currentStudents || 0} Enrolled Students
              </span>
            </div>
          </div>

          {/* Instructor Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-border bg-background p-3.5 sm:min-w-[260px]">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
              {teacher?.avatar ? (
                <img src={getAvatarUrl(teacher.avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                teacher?.fullName?.charAt(0).toUpperCase() || 'T'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Instructor</p>
              <p className="text-sm font-bold text-text truncate">{teacher?.fullName || 'Assigned Instructor'}</p>
              <p className="text-xs text-text-muted truncate">{teacher?.email || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Live Classroom Guidance & Action Hero */}
      <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
        isClassLive
          ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 via-surface to-surface'
          : 'border-border bg-gradient-to-r from-surface to-background'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isClassLive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-primary/10 text-primary'
              }`}>
                <MonitorIcon className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-text">Direct Live Classroom</h2>
              {isClassLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/20 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Teacher is Live Now
                </span>
              ) : (
                <Badge variant="default" className="text-xs">
                  Scheduled
                </Badge>
              )}
            </div>

            <p className="text-xs text-text-muted max-w-2xl leading-relaxed">
              Class schedule time:{' '}
              <span className="font-semibold text-text">
                {cls.classDays?.join(', ') || 'Days TBD'} • {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
              </span>
              . When your instructor starts the live broadcast, the Join Live Class button will become active immediately.
            </p>
          </div>

          <div className="shrink-0">
            {isClassLive && activeLiveSession ? (
              <Link to={`/student/classes/${activeLiveSession._id}/classroom`}>
                <Button
                  variant="primary"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 font-bold px-6 py-2.5"
                >
                  <MonitorIcon className="h-5 w-5" />
                  Join Live Class Now ↗
                </Button>
              </Link>
            ) : (
              <Button variant="outline" disabled className="gap-2 text-xs">
                <ClockIcon className="h-4 w-4" />
                Waiting for Instructor to Start Live
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-border pb-px scrollbar-none">
        {[
          { key: 'live', label: 'Live Classroom', icon: MonitorIcon, count: isClassLive ? 'Live' : undefined },
          { key: 'assignments', label: 'Assignments', icon: FileTextIcon, count: assignments.length },
          { key: 'quizzes', label: 'Quizzes', icon: ClipboardListIcon, count: quizzes.length },
          { key: 'materials', label: 'Study Materials', icon: BookOpenIcon, count: materials.length },
          { key: 'notices', label: 'Class Notices', icon: AlertCircleIcon, count: notices.length },
          { key: 'attendance', label: 'My Attendance', icon: CheckCircleIcon, count: attendanceRecords.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as StudentClassTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                  : 'border-transparent text-text-muted hover:text-text hover:bg-surface/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  tab.count === 'Live'
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-border text-text-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Tab 1: Live Classroom */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-text">Class Schedule Overview</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Class Days</span>
                    <span className="font-semibold text-text">{cls.classDays?.join(', ') || 'TBD'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Timing</span>
                    <span className="font-semibold text-text">{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Course Duration</span>
                    <span className="font-semibold text-text">{formatDate(cls.startDate)} – {formatDate(cls.endDate)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-text-muted">Assigned Instructor</span>
                    <span className="font-semibold text-primary">{teacher?.fullName || 'TBD'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-text">Live Classroom Status</h3>
                {isClassLive && activeLiveSession ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 mx-auto animate-ping"></div>
                    <p className="text-sm font-bold text-emerald-700">Live Session in Progress</p>
                    <p className="text-xs text-text-muted">
                      Your teacher started the live class: <span className="font-semibold text-text">{activeLiveSession.title}</span>
                    </p>
                    <Link to={`/student/classes/${activeLiveSession._id}/classroom`}>
                      <Button variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
                        Join Class Meeting
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-background p-6 text-center space-y-2">
                    <ClockIcon className="h-8 w-8 text-text-muted mx-auto" />
                    <p className="text-sm font-semibold text-text">No Live Session Active</p>
                    <p className="text-xs text-text-muted">
                      The class will turn live once your teacher clicks "Start Live Class".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assignments */}
        {activeTab === 'assignments' && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Class Assignments & Tasks</h3>
                <p className="text-xs text-text-muted">Submit your homework and track grades for this class.</p>
              </div>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                title="No assignments posted yet"
                description="When your teacher posts an assignment for this class, it will appear here."
                icon={<FileTextIcon className="h-10 w-10" />}
              />
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text truncate">{assignment.title}</h4>
                        <Badge variant={getStatusVariant(assignment.status)} className="capitalize text-xs">
                          {assignment.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-text-muted line-clamp-2">{assignment.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-text-muted">
                        <span>Due: <span className="font-semibold text-text">{formatDate(assignment.dueDate)}</span></span>
                        <span>Total Marks: <span className="font-semibold text-text">{assignment.totalMarks}</span></span>
                      </div>
                    </div>

                    <Link to={`/student/assignments/${assignment._id}`}>
                      <Button variant="outline" size="sm">
                        View & Submit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Quizzes */}
        {activeTab === 'quizzes' && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Class Quizzes & Tests</h3>
                <p className="text-xs text-text-muted">Take quizzes assigned to this class.</p>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <EmptyState
                title="No quizzes posted yet"
                description="When quizzes are scheduled for this class, you will be able to take them here."
                icon={<ClipboardListIcon className="h-10 w-10" />}
              />
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text truncate">{quiz.title}</h4>
                        <Badge variant={getStatusVariant(quiz.status)} className="capitalize text-xs">
                          {quiz.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-text-muted line-clamp-2">{quiz.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-text-muted">
                        <span>Duration: <span className="font-semibold text-text">{quiz.durationMinutes} mins</span></span>
                        <span>Total Marks: <span className="font-semibold text-text">{quiz.totalMarks}</span></span>
                        <span>Passing: <span className="font-semibold text-text">{quiz.passingMarks}</span></span>
                      </div>
                    </div>

                    <Link to={`/student/quizzes/${quiz._id}`}>
                      <Button variant="primary" size="sm">
                        Start Quiz
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Study Materials */}
        {activeTab === 'materials' && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Class Study Materials & Lecture Notes</h3>
                <p className="text-xs text-text-muted">PDF lecture notes, slides, and learning links uploaded by your teacher for this class.</p>
              </div>
              <Link to="/student/materials">
                <Button variant="outline" size="sm">All Materials</Button>
              </Link>
            </div>

            {materials.length === 0 ? (
              <EmptyState
                title="No study materials uploaded yet"
                description="When your teacher uploads study files, slides, or notes for this class, they will appear here."
                icon={<BookOpenIcon className="h-10 w-10" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {materials.map((mat) => (
                  <div key={mat._id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-text truncate">{mat.title}</h4>
                        {mat.description && (
                          <p className="mt-1 text-xs text-text-muted line-clamp-2">{mat.description}</p>
                        )}
                      </div>
                      <Badge variant="primary" className="uppercase text-[10px] shrink-0">
                        {mat.fileType || 'PDF'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                      <span className="text-text-muted">
                        Uploaded by: <span className="font-semibold text-text">{mat.teacherId?.fullName || 'Teacher'}</span>
                      </span>
                      {mat.fileUrl && (
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                        >
                          Download / Open ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Tab 5: Class Notices */}
        {activeTab === 'notices' && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Class Notices & Announcements</h3>
                <p className="text-xs text-text-muted">Updates posted for your class.</p>
              </div>
            </div>

            {notices.length === 0 ? (
              <EmptyState
                title="No notices yet"
                description="Class notices and announcements from your teacher will appear here."
                icon={<AlertCircleIcon className="h-10 w-10" />}
              />
            ) : (
              <div className="divide-y divide-border">
                {notices.map((notice) => (
                  <div key={notice._id} className="py-4 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {notice.priority === 'high' ? (
                        <AlertCircleIcon className="h-5 w-5 text-error" />
                      ) : (
                        <AlertCircleIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text">{notice.title}</h4>
                        {notice.priority && (
                          <Badge
                            variant={notice.priority === 'high' ? 'error' : 'default'}
                            className="capitalize text-[10px]"
                          >
                            {notice.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-text-muted leading-relaxed">{notice.description || (notice as any).content}</p>
                      {notice.attachmentUrl && (
                        <div className="mt-1.5">
                          <a
                            href={notice.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            📎 View Attachment ↗
                          </a>
                        </div>
                      )}
                      <p className="mt-1.5 text-[11px] text-text-muted">{formatDate(notice.publishDate || (notice as any).createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

            )}
          </div>
        )}

        {/* Tab 6: My Attendance */}
        {activeTab === 'attendance' && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">My Class Attendance</h3>
                <p className="text-xs text-text-muted">Attendance records for this class.</p>
              </div>
              <Link to="/student/attendance">
                <Button variant="outline" size="sm">Full Attendance Report</Button>
              </Link>
            </div>

            {attendanceRecords.length === 0 ? (
              <EmptyState
                title="No attendance records yet"
                description="Your attendance logged during live class sessions will be recorded here."
                icon={<CheckCircleIcon className="h-10 w-10" />}
              />
            ) : (
              <div className="space-y-3">
                {attendanceRecords.map((record) => (
                  <div
                    key={record._id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">{formatDate(record.attendanceDate || (record as any).date)}</p>
                      <p className="text-xs text-text-muted">
                        Session: {record.liveSession?.title || (record as any).sessionId?.title || 'Live Class'}
                      </p>
                    </div>

                    <Badge
                      variant={
                        record.status === 'present'
                          ? 'success'
                          : record.status === 'late'
                          ? 'warning'
                          : 'error'
                      }
                      className="capitalize"
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
