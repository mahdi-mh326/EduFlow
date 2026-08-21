import mongoose from "mongoose";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import Assignment from "../assignment/assignment.model.js";
import Quiz from "../quiz/quiz.model.js";
import LiveSession from "../live-session/live-session.model.js";
import Notice from "../notice/notice.model.js";
import Material from "../material/material.model.js";
import Attendance from "../attendance/attendance.model.js";
import Notification from "../notification/notification.model.js";
import Payment from "../payment/payment.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE } from "../user/user.constant.js";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS,
} from "../enrollment/enrollment.constant.js";
import { ASSIGNMENT_STATUS } from "../assignment/assignment.constant.js";
import { QUIZ_STATUS } from "../quiz/quiz.constant.js";
import { LIVE_SESSION_STATUS } from "../live-session/live-session.constant.js";
import { CHATBOT_CONTEXT_LIMITS, CHATBOT_MESSAGES } from "./chatbot.constant.js";

const getStudentEnrolledClassIds = async (studentId) => {
  return await Enrollment.find({
    studentId,
    status: ENROLLMENT_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  }).distinct("classId");
};

const getStudentEnrolledCourseIds = async (studentId) => {
  return await Enrollment.find({
    studentId,
    status: ENROLLMENT_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  }).distinct("courseId");
};

const getTeacherClassIds = async (teacherId) => {
  return await Class.find({
    teacherId,
    isDeleted: { $ne: true },
  }).distinct("_id");
};

const detectQueryDomain = (message) => {
  const lower = message.toLowerCase();

  if (/assignment|homework|task|submit|submission/.test(lower)) {
    return "assignment";
  }
  if (/quiz|test|exam|assessment/.test(lower)) {
    return "quiz";
  }
  if (/live|class.*session|session.*class|meeting|classroom/.test(lower)) {
    return "live_session";
  }
  if (/notice|announcement|update/.test(lower)) {
    return "notice";
  }
  if (/material|resource|lecture|pdf|file|download/.test(lower)) {
    return "material";
  }
  if (/attendance|present|absent|check.?in/.test(lower)) {
    return "attendance";
  }
  if (/notification|alert|message|inbox/.test(lower)) {
    return "notification";
  }
  if (/enroll|enrolled|registration|course.*join|join.*course/.test(lower)) {
    return "enrollment";
  }
  if (/teacher|instructor|faculty/.test(lower)) {
    return "teacher";
  }
  if (/student|learner/.test(lower)) {
    return "student";
  }

  return "general";
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const retrieveStudentContext = async (userId) => {
  const [enrolledClassIds, enrolledCourseIds] = await Promise.all([
    getStudentEnrolledClassIds(userId),
    getStudentEnrolledCourseIds(userId),
  ]);

  const [
    assignments,
    quizzes,
    liveSessions,
    notices,
    materials,
    attendanceRecords,
    notifications,
    enrollments,
  ] = await Promise.all([
    Assignment.find({
      classId: { $in: enrolledClassIds },
      status: ASSIGNMENT_STATUS.PUBLISHED,
      isDeleted: { $ne: true },
    })
      .sort({ dueDate: 1 })
      .limit(CHATBOT_CONTEXT_LIMITS.ASSIGNMENTS)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title dueDate totalMarks courseId classId"),

    Quiz.find({
      classId: { $in: enrolledClassIds },
      status: QUIZ_STATUS.PUBLISHED,
      isDeleted: { $ne: true },
    })
      .sort({ startDate: 1 })
      .limit(CHATBOT_CONTEXT_LIMITS.QUIZZES)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title startDate endDate durationMinutes totalMarks courseId classId"),

    LiveSession.find({
      classId: { $in: enrolledClassIds },
      isDeleted: { $ne: true },
      scheduledDate: { $gte: new Date() },
    })
      .sort({ scheduledDate: 1 })
      .limit(CHATBOT_CONTEXT_LIMITS.LIVE_SESSIONS)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title scheduledDate startTime endTime meetingUrl courseId classId"),

    Notice.find({
      $or: [
        { classId: { $in: enrolledClassIds } },
        { courseId: { $in: enrolledCourseIds } },
      ],
      isDeleted: { $ne: true },
    })
      .sort({ publishDate: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.NOTICES)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title description priority publishDate expiryDate courseId classId"),

    Material.find({
      classId: { $in: enrolledClassIds },
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.MATERIALS)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title description fileType visibility courseId classId"),

    Attendance.find({
      studentId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ attendanceDate: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.ATTENDANCE)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("status attendanceDate checkInTime remarks courseId classId"),

    Notification.find({
      recipientId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.NOTIFICATIONS)
      .select("title message type isRead createdAt"),

    Enrollment.find({
      studentId: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      isDeleted: { $ne: true },
    })
      .sort({ enrolledAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.ENROLLMENTS)
      .populate("courseId", "title slug shortDescription price")
      .populate("classId", "batchName startDate endDate")
      .select("paymentStatus enrolledAt courseId classId sectionId"),
  ]);

  const context = {
    role: USER_ROLE.STUDENT,
    assignments: assignments
      .filter((a) => a.courseId || a.classId)
      .map((a) => ({
        title: a.title,
        dueDate: formatDate(a.dueDate),
        course: a.courseId?.title || "Unknown",
        class: a.classId?.batchName || "Unknown",
        totalMarks: a.totalMarks,
      })),
    quizzes: quizzes
      .filter((q) => q.courseId || q.classId)
      .map((q) => ({
        title: q.title,
        startDate: formatDate(q.startDate),
        endDate: formatDate(q.endDate),
        duration: q.durationMinutes,
        totalMarks: q.totalMarks,
        course: q.courseId?.title || "Unknown",
        class: q.classId?.batchName || "Unknown",
      })),
    liveSessions: liveSessions
      .filter((s) => s.courseId || s.classId)
      .map((s) => ({
        title: s.title,
        date: formatDate(s.scheduledDate),
        time: `${s.startTime} - ${s.endTime}`,
        course: s.courseId?.title || "Unknown",
        class: s.classId?.batchName || "Unknown",
      })),
    notices: notices
      .filter((n) => n.title)
      .map((n) => ({
        title: n.title,
        description: n.description?.slice(0, 200) || "",
        priority: n.priority,
        publishDate: formatDate(n.publishDate),
        course: n.courseId?.title || "General",
        class: n.classId?.batchName || "General",
      })),
    materials: materials
      .filter((m) => m.title)
      .map((m) => ({
        title: m.title,
        description: m.description?.slice(0, 200) || "",
        fileType: m.fileType,
        visibility: m.visibility,
        course: m.courseId?.title || "Unknown",
        class: m.classId?.batchName || "Unknown",
      })),
    attendance: attendanceRecords
      .filter((a) => a.courseId || a.classId)
      .map((a) => ({
        status: a.status,
        date: formatDate(a.attendanceDate),
        checkIn: a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "N/A",
        remarks: a.remarks || "",
        course: a.courseId?.title || "Unknown",
        class: a.classId?.batchName || "Unknown",
      })),
    notifications: notifications
      .filter((n) => n.title)
      .map((n) => ({
        title: n.title,
        message: n.message?.slice(0, 150) || "",
        type: n.type,
        isRead: n.isRead,
        createdAt: formatDate(n.createdAt),
      })),
    enrollments: enrollments
      .filter((e) => e.courseId)
      .map((e) => ({
        course: e.courseId?.title || "Unknown",
        class: e.classId?.batchName || "Unknown",
        section: e.sectionId,
        paymentStatus: e.paymentStatus,
        enrolledAt: formatDate(e.enrolledAt),
      })),
  };

  return context;
};

const retrieveTeacherContext = async (userId) => {
  const [classIds, teacherProfile] = await Promise.all([
    getTeacherClassIds(userId),
    User.findById(userId).select("fullName email"),
  ]);

  const [
    assignments,
    quizzes,
    liveSessions,
    notices,
    materials,
    attendanceRecords,
    notifications,
    enrollments,
  ] = await Promise.all([
    Assignment.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.ASSIGNMENTS)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title dueDate totalMarks status courseId classId"),

    Quiz.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.QUIZZES)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title startDate endDate durationMinutes totalMarks status courseId classId"),

    LiveSession.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ scheduledDate: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.LIVE_SESSIONS)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title scheduledDate startTime endTime status courseId classId"),

    Notice.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ publishDate: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.NOTICES)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title description priority publishDate courseId classId"),

    Material.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.MATERIALS)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("title description fileType visibility courseId classId"),

    Attendance.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ attendanceDate: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.ATTENDANCE)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .populate("studentId", "fullName email")
      .select("status attendanceDate remarks studentId courseId classId"),

    Notification.find({
      recipientId: userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.NOTIFICATIONS)
      .select("title message type isRead createdAt"),

    Enrollment.find({
      classId: { $in: classIds },
      status: ENROLLMENT_STATUS.ACTIVE,
      isDeleted: { $ne: true },
    })
      .sort({ enrolledAt: -1 })
      .limit(CHATBOT_CONTEXT_LIMITS.ENROLLMENTS)
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .populate("studentId", "fullName email")
      .select("paymentStatus enrolledAt courseId classId sectionId studentId"),
  ]);

  const classes = await Class.find({
    teacherId: userId,
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(CHATBOT_CONTEXT_LIMITS.ENROLLMENTS)
    .populate("courseId", "title")
    .select("batchName startDate endTime status courseId sections");

  const context = {
    role: USER_ROLE.TEACHER,
    teacherName: teacherProfile?.fullName || "Unknown",
    assignments: assignments
      .filter((a) => a.courseId || a.classId)
      .map((a) => ({
        title: a.title,
        dueDate: formatDate(a.dueDate),
        status: a.status,
        course: a.courseId?.title || "Unknown",
        class: a.classId?.batchName || "Unknown",
        totalMarks: a.totalMarks,
      })),
    quizzes: quizzes
      .filter((q) => q.courseId || q.classId)
      .map((q) => ({
        title: q.title,
        startDate: formatDate(q.startDate),
        endDate: formatDate(q.endDate),
        status: q.status,
        course: q.courseId?.title || "Unknown",
        class: q.classId?.batchName || "Unknown",
        totalMarks: q.totalMarks,
      })),
    liveSessions: liveSessions
      .filter((s) => s.courseId || s.classId)
      .map((s) => ({
        title: s.title,
        date: formatDate(s.scheduledDate),
        time: `${s.startTime} - ${s.endTime}`,
        status: s.status,
        course: s.courseId?.title || "Unknown",
        class: s.classId?.batchName || "Unknown",
      })),
    notices: notices
      .filter((n) => n.title)
      .map((n) => ({
        title: n.title,
        description: n.description?.slice(0, 200) || "",
        priority: n.priority,
        publishDate: formatDate(n.publishDate),
        course: n.courseId?.title || "General",
        class: n.classId?.batchName || "General",
      })),
    materials: materials
      .filter((m) => m.title)
      .map((m) => ({
        title: m.title,
        description: m.description?.slice(0, 200) || "",
        fileType: m.fileType,
        visibility: m.visibility,
        course: m.courseId?.title || "Unknown",
        class: m.classId?.batchName || "Unknown",
      })),
    attendance: attendanceRecords
      .filter((a) => a.courseId || a.classId)
      .map((a) => ({
        student: a.studentId?.fullName || "Unknown",
        status: a.status,
        date: formatDate(a.attendanceDate),
        remarks: a.remarks || "",
        course: a.courseId?.title || "Unknown",
        class: a.classId?.batchName || "Unknown",
      })),
    notifications: notifications
      .filter((n) => n.title)
      .map((n) => ({
        title: n.title,
        message: n.message?.slice(0, 150) || "",
        type: n.type,
        isRead: n.isRead,
        createdAt: formatDate(n.createdAt),
      })),
    enrollments: enrollments
      .filter((e) => e.courseId)
      .map((e) => ({
        student: e.studentId?.fullName || "Unknown",
        course: e.courseId?.title || "Unknown",
        class: e.classId?.batchName || "Unknown",
        section: e.sectionId,
        paymentStatus: e.paymentStatus,
        enrolledAt: formatDate(e.enrolledAt),
      })),
    classes: classes
      .filter((c) => c.courseId)
      .map((c) => ({
        batchName: c.batchName,
        startDate: formatDate(c.startDate),
        endTime: c.endTime,
        status: c.status,
        course: c.courseId?.title || "Unknown",
        sections: c.sections?.map((s) => `${s.name}: ${s.currentStudents}/${s.capacity}`).join(", "),
      })),
  };

  return context;
};

const retrieveAdminContext = async (userId) => {
  const [users, enrollments, courses] = await Promise.all([
    User.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("fullName email role status isVerified"),

    Enrollment.find({ isDeleted: { $ne: true } })
      .sort({ enrolledAt: -1 })
      .limit(20)
      .populate("studentId", "fullName email")
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("paymentStatus status enrolledAt studentId courseId classId"),

    Course.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("title status price category difficulty"),
  ]);

  return {
    role: USER_ROLE.ADMIN,
    users: users.map((u) => ({
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      isVerified: u.isVerified,
    })),
    enrollments: enrollments.map((e) => ({
      student: e.studentId?.fullName || "Unknown",
      course: e.courseId?.title || "Unknown",
      class: e.classId?.batchName || "Unknown",
      paymentStatus: e.paymentStatus,
      status: e.status,
      enrolledAt: formatDate(e.enrolledAt),
    })),
    courses: courses.map((c) => ({
      title: c.title,
      status: c.status,
      price: c.price,
      category: c.category,
      difficulty: c.difficulty,
    })),
  };
};

const retrieveSuperAdminContext = async (userId) => {
  const [users, enrollments, courses, payments] = await Promise.all([
    User.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("fullName email role status isVerified"),

    Enrollment.find({ isDeleted: { $ne: true } })
      .sort({ enrolledAt: -1 })
      .limit(20)
      .populate("studentId", "fullName email")
      .populate("courseId", "title")
      .populate("classId", "batchName")
      .select("paymentStatus status enrolledAt studentId courseId classId"),

    Course.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("title status price category difficulty"),

    Payment.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("studentId", "fullName email")
      .populate("courseId", "title")
      .select("amount currency status paidAt studentId courseId transactionId"),
  ]);

  return {
    role: "super_admin",
    users: users.map((u) => ({
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      isVerified: u.isVerified,
    })),
    enrollments: enrollments.map((e) => ({
      student: e.studentId?.fullName || "Unknown",
      course: e.courseId?.title || "Unknown",
      class: e.classId?.batchName || "Unknown",
      paymentStatus: e.paymentStatus,
      status: e.status,
      enrolledAt: formatDate(e.enrolledAt),
    })),
    courses: courses.map((c) => ({
      title: c.title,
      status: c.status,
      price: c.price,
      category: c.category,
      difficulty: c.difficulty,
    })),
    payments: payments.map((p) => ({
      student: p.studentId?.fullName || "Unknown",
      course: p.courseId?.title || "Unknown",
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt ? formatDate(p.paidAt) : "Pending",
    })),
  };
};

const formatContextForAI = (context) => {
  const lines = [];

  lines.push(`User Role: ${context.role}`);
  if (context.teacherName) {
    lines.push(`Teacher: ${context.teacherName}`);
  }

  if (context.enrollments && context.enrollments.length > 0) {
    lines.push("\nEnrollments:");
    context.enrollments.forEach((e) => {
      lines.push(`- ${e.course} (${e.class}, Section ${e.section}) | Payment: ${e.paymentStatus} | Enrolled: ${e.enrolledAt}`);
      if (e.student) {
        lines.push(`  Student: ${e.student}`);
      }
    });
  }

  if (context.assignments && context.assignments.length > 0) {
    lines.push("\nAssignments:");
    context.assignments.forEach((a) => {
      lines.push(`- ${a.title} | Due: ${a.dueDate} | Marks: ${a.totalMarks} | Course: ${a.course} | Class: ${a.class}`);
    });
  }

  if (context.quizzes && context.quizzes.length > 0) {
    lines.push("\nQuizzes:");
    context.quizzes.forEach((q) => {
      lines.push(`- ${q.title} | ${q.startDate} to ${q.endDate} | Duration: ${q.duration} min | Marks: ${q.totalMarks} | Course: ${q.course} | Class: ${q.class}`);
    });
  }

  if (context.liveSessions && context.liveSessions.length > 0) {
    lines.push("\nLive Sessions:");
    context.liveSessions.forEach((s) => {
      lines.push(`- ${s.title} | ${s.date} | ${s.time} | Course: ${s.course} | Class: ${s.class}`);
    });
  }

  if (context.notices && context.notices.length > 0) {
    lines.push("\nNotices:");
    context.notices.forEach((n) => {
      lines.push(`- ${n.title} | Priority: ${n.priority} | Published: ${n.publishDate} | Course: ${n.course} | Class: ${n.class}`);
      if (n.description) {
        lines.push(`  ${n.description}`);
      }
    });
  }

  if (context.materials && context.materials.length > 0) {
    lines.push("\nMaterials:");
    context.materials.forEach((m) => {
      lines.push(`- ${m.title} | Type: ${m.fileType} | Visibility: ${m.visibility} | Course: ${m.course} | Class: ${m.class}`);
      if (m.description) {
        lines.push(`  ${m.description}`);
      }
    });
  }

  if (context.attendance && context.attendance.length > 0) {
    lines.push("\nAttendance Records:");
    context.attendance.forEach((a) => {
      lines.push(`- Status: ${a.status} | Date: ${a.date} | Check-in: ${a.checkIn} | Course: ${a.course} | Class: ${a.class}`);
      if (a.remarks) {
        lines.push(`  Remarks: ${a.remarks}`);
      }
    });
  }

  if (context.notifications && context.notifications.length > 0) {
    lines.push("\nNotifications:");
    context.notifications.forEach((n) => {
      lines.push(`- ${n.title} | Type: ${n.type} | Read: ${n.isRead} | Date: ${n.createdAt}`);
      if (n.message) {
        lines.push(`  ${n.message}`);
      }
    });
  }

  if (context.classes && context.classes.length > 0) {
    lines.push("\nClasses:");
    context.classes.forEach((c) => {
      lines.push(`- ${c.batchName} | Course: ${c.course} | Status: ${c.status} | Sections: ${c.sections}`);
    });
  }

  if (context.users && context.users.length > 0) {
    lines.push("\nUsers (admin summary):");
    context.users.forEach((u) => {
      lines.push(`- ${u.fullName} | ${u.email} | Role: ${u.role} | Status: ${u.status}`);
    });
  }

  if (context.courses && context.courses.length > 0) {
    lines.push("\nCourses (admin summary):");
    context.courses.forEach((c) => {
      lines.push(`- ${c.title} | Status: ${c.status} | Price: ${c.price} | Category: ${c.category}`);
    });
  }

  if (context.payments && context.payments.length > 0) {
    lines.push("\nRecent Payments (super admin):");
    context.payments.forEach((p) => {
      lines.push(`- ${p.student} | ${p.course} | ${p.amount} ${p.currency} | Status: ${p.status} | Paid: ${p.paidAt}`);
    });
  }

  return lines.join("\n");
};

const retrieveAuthorizedContext = async (userId, userRole, queryDomain) => {
  try {
    let context;

    if (userRole === USER_ROLE.STUDENT) {
      context = await retrieveStudentContext(userId);
    } else if (userRole === USER_ROLE.TEACHER) {
      context = await retrieveTeacherContext(userId);
    } else if (userRole === USER_ROLE.ADMIN) {
      context = await retrieveAdminContext(userId);
    } else if (userRole === USER_ROLE.SUPER_ADMIN) {
      context = await retrieveSuperAdminContext(userId);
    } else {
      return null;
    }

    return context;
  } catch (error) {
    throw new ApiError(500, "Failed to retrieve context");
  }
};

const getSourcesFromContext = (context) => {
  const sources = [];

  if (context.assignments) {
    context.assignments.forEach((a) => {
      sources.push({ type: "assignment", title: a.title });
    });
  }

  if (context.quizzes) {
    context.quizzes.forEach((q) => {
      sources.push({ type: "quiz", title: q.title });
    });
  }

  if (context.liveSessions) {
    context.liveSessions.forEach((s) => {
      sources.push({ type: "live_session", title: s.title });
    });
  }

  if (context.notices) {
    context.notices.forEach((n) => {
      sources.push({ type: "notice", title: n.title });
    });
  }

  if (context.materials) {
    context.materials.forEach((m) => {
      sources.push({ type: "material", title: m.title });
    });
  }

  if (context.attendance) {
    context.attendance.forEach((a) => {
      sources.push({ type: "attendance", title: `Attendance - ${a.date}` });
    });
  }

  if (context.notifications) {
    context.notifications.forEach((n) => {
      sources.push({ type: "notification", title: n.title });
    });
  }

  if (context.enrollments) {
    context.enrollments.forEach((e) => {
      sources.push({ type: "enrollment", title: e.course });
    });
  }

  if (context.classes) {
    context.classes.forEach((c) => {
      sources.push({ type: "class", title: c.batchName });
    });
  }

  return sources.slice(0, 20);
};

const SYSTEM_PROMPT = `You are EduFlow LMS Assistant, a helpful academic assistant for the EduFlow Learning Management System.

Your responsibilities:
- Help users with information about their courses, classes, assignments, quizzes, live sessions, notices, materials, attendance, and notifications
- Answer questions using ONLY the EduFlow context provided to you
- If information is not available in the context, say "I couldn't find that information in your EduFlow account."
- Never invent or hallucinate academic data
- Be concise and helpful
- Respect the user's role (student, teacher, admin, super_admin)
- Do not expose sensitive information like passwords, tokens, or payment gateway secrets
- If a student asks about another student's private data, politely decline and explain you can only access their own data
- If a teacher asks about another teacher's classes, politely decline and explain you can only access their own classes
- Provide direct, useful answers based on the context provided

Remember: You are an EduFlow-aware assistant. Your answers should be relevant to academic learning, course management, and LMS operations.`;

export const ChatbotService = {
  detectQueryDomain,
  retrieveAuthorizedContext,
  formatContextForAI,
  getSourcesFromContext,
  SYSTEM_PROMPT,
  CHATBOT_MESSAGES,
};

export default ChatbotService;
