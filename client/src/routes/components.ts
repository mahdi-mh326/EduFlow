import { lazy, type ComponentType } from 'react'

function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory()
    } catch (error: any) {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes("Unexpected token '<'")

      if (isChunkError) {
        const key = 'eduflow_chunk_load_' + window.location.pathname
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, 'true')
          window.location.reload()
          return new Promise<{ default: T }>(() => {})
        }
      }
      throw error
    }
  })
}

export const Home = lazyWithRetry(() => import('@/pages/Home'))
export const Courses = lazyWithRetry(() => import('@/pages/Courses').then((module) => ({ default: module.Courses })))

export const CourseDetails = lazy(() => import('@/pages/CourseDetails').then((module) => ({ default: module.CourseDetails })))
export const Register = lazy(() => import('@/pages/Register').then((module) => ({ default: module.Register })))
export const Login = lazy(() => import('@/pages/Login').then((module) => ({ default: module.Login })))
export const VerifyOTP = lazy(() => import('@/pages/VerifyOTP').then((module) => ({ default: module.VerifyOTP })))
export const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').then((module) => ({ default: module.ForgotPassword })))
export const SetPassword = lazy(() => import('@/pages/SetPassword').then((module) => ({ default: module.SetPassword })))

export const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard').then((module) => ({ default: module.StudentDashboard })))
export const StudentProfile = lazy(() => import('@/pages/student/StudentProfile').then((module) => ({ default: module.StudentProfile })))
export const MyEnrollments = lazy(() => import('@/pages/student/MyEnrollments').then((module) => ({ default: module.MyEnrollments })))
export const Notifications = lazy(() => import('@/pages/student/Notifications').then((module) => ({ default: module.Notifications })))
export const Assignments = lazy(() => import('@/pages/student/Assignments').then((module) => ({ default: module.Assignments })))
export const AssignmentDetails = lazy(() => import('@/pages/student/AssignmentDetails').then((module) => ({ default: module.AssignmentDetails })))
export const Quizzes = lazy(() => import('@/pages/student/Quizzes').then((module) => ({ default: module.Quizzes })))
export const QuizDetails = lazy(() => import('@/pages/student/QuizDetails').then((module) => ({ default: module.QuizDetails })))
export const StudentQuizResults = lazy(() => import('@/pages/student/StudentQuizResults').then((module) => ({ default: module.StudentQuizResults })))
export const LiveClasses = lazyWithRetry(() => import('@/pages/student/LiveClasses').then((module) => ({ default: module.LiveClasses })))
export const StudentClassDetails = lazyWithRetry(() => import('@/pages/student/StudentClassDetails').then((module) => ({ default: module.StudentClassDetails })))
export const Classroom = lazyWithRetry(() => import('@/pages/student/Classroom').then((module) => ({ default: module.Classroom })))

export const Attendance = lazy(() => import('@/pages/student/Attendance').then((module) => ({ default: module.Attendance })))
export const StudentCertificates = lazy(() => import('@/pages/student/StudentCertificates').then((module) => ({ default: module.StudentCertificates })))
export const ChatbotPage = lazy(() => import('@/pages/student/Chatbot').then((module) => ({ default: module.ChatbotPage })))

export const PaymentResult = lazy(() => import('@/pages/PaymentResult').then((module) => ({ default: module.PaymentResult })))
export const StudentPayments = lazy(() => import('@/pages/student/StudentPayments').then((module) => ({ default: module.StudentPayments })))
export const TeacherDashboard = lazy(() => import('@/pages/teacher/TeacherDashboard').then((module) => ({ default: module.TeacherDashboard })))
export const TeacherProfile = lazy(() => import('@/pages/teacher/TeacherProfile').then((module) => ({ default: module.TeacherProfile })))
export const TeacherClasses = lazy(() => import('@/pages/teacher/TeacherClasses').then((module) => ({ default: module.TeacherClasses })))
export const TeacherClassDetails = lazyWithRetry(() => import('@/pages/teacher/TeacherClassDetails').then((module) => ({ default: module.TeacherClassDetails })))
export const TeacherAssignments = lazy(() => import('@/pages/teacher/TeacherAssignments').then((module) => ({ default: module.TeacherAssignments })))
export const TeacherAssignmentDetails = lazy(() => import('@/pages/teacher/TeacherAssignmentDetails').then((module) => ({ default: module.TeacherAssignmentDetails })))
export const TeacherQuizzes = lazy(() => import('@/pages/teacher/TeacherQuizzes').then((module) => ({ default: module.TeacherQuizzes })))
export const TeacherQuizDetails = lazy(() => import('@/pages/teacher/TeacherQuizDetails').then((module) => ({ default: module.TeacherQuizDetails })))
export const TeacherLiveClasses = lazyWithRetry(() => import('@/pages/teacher/TeacherLiveClasses').then((module) => ({ default: module.TeacherLiveClasses })))
export const TeacherClassroom = lazyWithRetry(() => import('@/pages/teacher/TeacherClassroom').then((module) => ({ default: module.TeacherClassroom })))

export const TeacherAttendance = lazy(() => import('@/pages/teacher/TeacherAttendance').then((module) => ({ default: module.TeacherAttendance })))
export const StudentMaterials = lazy(() => import('@/pages/student/Materials').then((module) => ({ default: module.StudentMaterials })))
export const StudentNotices = lazy(() => import('@/pages/student/Notices').then((module) => ({ default: module.StudentNotices })))
export const TeacherMaterials = lazy(() => import('@/pages/teacher/TeacherMaterials').then((module) => ({ default: module.TeacherMaterials })))
export const TeacherNotices = lazy(() => import('@/pages/teacher/TeacherNotices').then((module) => ({ default: module.TeacherNotices })))
export const AdminMaterials = lazy(() => import('@/pages/admin/AdminMaterials').then((module) => ({ default: module.AdminMaterials })))
export const AdminNotices = lazy(() => import('@/pages/admin/AdminNotices').then((module) => ({ default: module.AdminNotices })))
export const AdminLiveSessions = lazy(() => import('@/pages/admin/AdminLiveSessions').then((module) => ({ default: module.AdminLiveSessions })))
export const AdminAttendance = lazy(() => import('@/pages/admin/AdminAttendance').then((module) => ({ default: module.AdminAttendance })))
export const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })))
export const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses').then((module) => ({ default: module.AdminCourses })))
export const AdminClasses = lazy(() => import('@/pages/admin/AdminClasses').then((module) => ({ default: module.AdminClasses })))
export const AdminTeachers = lazy(() => import('@/pages/admin/AdminTeachers').then((module) => ({ default: module.AdminTeachers })))
export const AdminEnrollments = lazy(() => import('@/pages/admin/AdminEnrollments').then((module) => ({ default: module.AdminEnrollments })))
export const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments').then((module) => ({ default: module.AdminPayments })))
export const AdminAdmins = lazy(() => import('@/pages/admin/AdminAdmins').then((module) => ({ default: module.AdminAdmins })))
export const AdminStudents = lazy(() => import('@/pages/admin/AdminStudents').then((module) => ({ default: module.AdminStudents })))
export const AdminProfile = lazy(() => import('@/pages/admin/AdminProfile').then((module) => ({ default: module.AdminProfile })))
export const AdminCertificates = lazy(() => import('@/pages/admin/AdminCertificates').then((module) => ({ default: module.AdminCertificates })))
export const VerifyCertificate = lazy(() => import('@/pages/VerifyCertificate').then((module) => ({ default: module.VerifyCertificate })))




