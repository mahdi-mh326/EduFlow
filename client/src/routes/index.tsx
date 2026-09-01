import { type ReactElement } from 'react'
import { Route } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute, RoleRoute } from '@/components'
import { StudentLayout, TeacherLayout } from '@/layouts'
import {
  Home, Courses, CourseDetails, Register, Login, VerifyOTP, ForgotPassword, SetPassword,
  StudentDashboard, StudentProfile, MyEnrollments, Notifications, Assignments, AssignmentDetails, Quizzes, QuizDetails, StudentQuizResults,
  LiveClasses, StudentClassDetails, Classroom, Attendance, ChatbotPage, PaymentResult, StudentPayments,

  StudentMaterials, StudentNotices,
  TeacherDashboard, TeacherProfile, TeacherClasses, TeacherClassDetails, TeacherAssignments, TeacherAssignmentDetails,
  TeacherQuizzes, TeacherQuizDetails, TeacherLiveClasses, TeacherClassroom, TeacherAttendance,
  TeacherMaterials, TeacherNotices,
  AdminDashboard, AdminCourses, AdminClasses, AdminTeachers, AdminEnrollments, AdminPayments, AdminAdmins,
  AdminNotices, AdminLiveSessions, AdminAttendance, AdminStudents, AdminProfile, AdminCertificates,
  VerifyCertificate, StudentCertificates,
} from './components'






export const publicRoutes: ReactElement[] = [
  <Route key="root" path="/" element={<Home />} />,
  <Route key="courses" path="/courses" element={<Courses />} />,
  <Route key="course-details" path="/courses/:courseId" element={<CourseDetails />} />,
  <Route key="register" path="/register" element={<Register />} />,
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="verify-otp" path="/verify-otp" element={<VerifyOTP />} />,
  <Route key="forgot-password" path="/forgot-password" element={<ForgotPassword />} />,
  <Route key="set-password" path="/set-password" element={<ProtectedRoute><SetPassword /></ProtectedRoute>} />,
  <Route key="verify-certificate" path="/verify-certificate" element={<VerifyCertificate />} />,
  <Route key="verify-certificate-id" path="/verify-certificate/:certificateNumber" element={<VerifyCertificate />} />,
]



export const studentRoutes: ReactElement[] = [
  <Route
    key="student-dashboard"
    path="/student/dashboard"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentDashboard />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-profile"
    path="/student/profile"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentProfile />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-enrollments"
    path="/student/enrollments"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <MyEnrollments />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-notifications"
    path="/student/notifications"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <Notifications />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-materials"
    path="/student/materials"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentMaterials />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-notices"
    path="/student/notices"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentNotices />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-assignments"
    path="/student/assignments"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <Assignments />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-assignment-details"
    path="/student/assignments/:assignmentId"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <AssignmentDetails />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-quizzes"
    path="/student/quizzes"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <Quizzes />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-quiz-details"
    path="/student/quizzes/:quizId"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <QuizDetails />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-quiz-results"
    path="/student/quizzes/results"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentQuizResults />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-live-classes"
    path="/student/classes"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <LiveClasses />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-class-details"
    path="/student/classes/:classId"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentClassDetails />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-classroom"
    path="/student/classes/:sessionId/classroom"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <Classroom />
        </StudentLayout>
      </RoleRoute>
    }
  />,

  <Route
    key="student-attendance"
    path="/student/attendance"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <Attendance />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-certificates"
    path="/student/certificates"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentCertificates />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-payments"

    path="/student/payments"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <StudentPayments />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-chatbot"
    path="/student/chatbot"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <ChatbotPage />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="payment-result"
    path="/payment/result"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <PaymentResult />
        </StudentLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="student-payment-result"
    path="/student/payment/result"
    element={
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout>
          <PaymentResult />
        </StudentLayout>
      </RoleRoute>
    }
  />,
]


export const teacherRoutes: ReactElement[] = [
  <Route
    key="teacher-dashboard"
    path="/teacher/dashboard"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherDashboard />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-profile"
    path="/teacher/profile"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherProfile />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-classes"
    path="/teacher/classes"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherClasses />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-class-details"
    path="/teacher/classes/:classId"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherClassDetails />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-assignments"
    path="/teacher/assignments"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherAssignments />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-assignment-details"
    path="/teacher/assignments/:assignmentId"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherAssignmentDetails />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-quizzes"
    path="/teacher/quizzes"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherQuizzes />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-quiz-details"
    path="/teacher/quizzes/:quizId"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherQuizDetails />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-live-classes"
    path="/teacher/live-classes"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherLiveClasses />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-classroom"
    path="/teacher/live-classes/:sessionId/classroom"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherClassroom />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-attendance"
    path="/teacher/attendance"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherAttendance />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-materials"
    path="/teacher/materials"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherMaterials />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="teacher-notices"
    path="/teacher/notices"
    element={
      <RoleRoute allowedRoles={['teacher']}>
        <TeacherLayout>
          <TeacherNotices />
        </TeacherLayout>
      </RoleRoute>
    }
  />,
]

export const adminRoutes: ReactElement[] = [
  <Route
    key="admin-dashboard"
    path="/admin/dashboard"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-courses"
    path="/admin/courses"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminCourses />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-classes"
    path="/admin/classes"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminClasses />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-teachers"
    path="/admin/teachers"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminTeachers />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-live-sessions"
    path="/admin/live-sessions"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminLiveSessions />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-attendance"
    path="/admin/attendance"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminAttendance />
        </AdminLayout>
      </RoleRoute>
    }
  />,

  <Route
    key="admin-notices"
    path="/admin/notices"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminNotices />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-enrollments"
    path="/admin/enrollments"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminEnrollments />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-payments"
    path="/admin/payments"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminPayments />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-admins"
    path="/admin/admins"
    element={
      <RoleRoute allowedRoles={['admin']} requireMasterAdmin={true}>
        <AdminLayout>
          <AdminAdmins />
        </AdminLayout>
      </RoleRoute>

    }
  />,
  <Route
    key="admin-students"
    path="/admin/students"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminStudents />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-certificates"
    path="/admin/certificates"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminCertificates />
        </AdminLayout>
      </RoleRoute>
    }
  />,
  <Route
    key="admin-profile"
    path="/admin/profile"
    element={
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminProfile />
        </AdminLayout>
      </RoleRoute>
    }
  />,
]



