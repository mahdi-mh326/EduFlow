import crypto from "crypto";
import Certificate from "./certificate.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import Class from "../class/class.model.js";
import Course from "../course/course.model.js";
import LiveSession from "../live-session/live-session.model.js";
import Attendance from "../attendance/attendance.model.js";
import Assignment from "../assignment/assignment.model.js";
import Submission from "../assignment/submission.model.js";
import Quiz from "../quiz/quiz.model.js";
import QuizAttempt from "../quiz/attempt.model.js";
import ApiError from "../../shared/ApiError.js";
import { ENROLLMENT_STATUS, PAYMENT_STATUS } from "../enrollment/enrollment.constant.js";
import { NotificationService } from "../notification/notification.service.js";

const generateCertificateNumber = () => {
  const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
  const year = new Date().getFullYear();
  return `EDF-${year}-${randomHex}`;
};

const calculateStudentProgress = async (studentId, classId) => {
  const cls = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
  if (!cls) throw new ApiError(404, "Class not found");

  // 1. Live sessions & Attendance
  const totalLive = await LiveSession.countDocuments({
    classId,
    isDeleted: { $ne: true },
  });
  const attendedLive = await Attendance.countDocuments({
    classId,
    studentId,
    status: { $in: ["present", "late"] },
    isDeleted: { $ne: true },
  });

  // 2. Assignments & Submissions
  const totalAssignments = await Assignment.countDocuments({
    classId,
    status: "published",
    isDeleted: { $ne: true },
  });
  const submittedAssignments = await Submission.countDocuments({
    classId,
    studentId,
    status: { $in: ["submitted", "graded"] },
    isDeleted: { $ne: true },
  });

  // 3. Quizzes & Attempts
  const totalQuizzes = await Quiz.countDocuments({
    classId,
    status: "published",
    isDeleted: { $ne: true },
  });
  const attemptedQuizzes = await QuizAttempt.countDocuments({
    classId,
    studentId,
    status: "completed",
    isDeleted: { $ne: true },
  });

  const totalItems = totalLive + totalAssignments + totalQuizzes;
  const completedItems = attendedLive + submittedAssignments + attemptedQuizzes;

  const percentage = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 100;

  return {
    classId,
    courseId: cls.courseId,
    totalItems,
    completedItems,
    percentage,
    breakdown: {
      live: { attended: attendedLive, total: totalLive },
      assignments: { submitted: submittedAssignments, total: totalAssignments },
      quizzes: { attempted: attemptedQuizzes, total: totalQuizzes },
    },
    isEligibleForCertificate: percentage >= 80,
  };
};

const generateCertificate = async (studentId, classId) => {
  // Check active enrollment
  const enrollment = await Enrollment.findOne({
    studentId,
    classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  }).populate("courseId", "title slug category").populate("classId", "batchName");

  if (!enrollment) {
    throw new ApiError(403, "You are not actively enrolled in this class.");
  }

  // Check if certificate already exists
  let certificate = await Certificate.findOne({
    studentId,
    classId,
    isRevoked: { $ne: true },
  })
    .populate("studentId", "fullName email avatar")
    .populate("courseId", "title slug category thumbnail duration durationUnit")
    .populate("classId", "batchName startDate endDate");

  if (certificate) {
    return certificate;
  }

  // Calculate progress
  const progress = await calculateStudentProgress(studentId, classId);
  if (!progress.isEligibleForCertificate) {
    throw new ApiError(
      400,
      `Course completion progress is currently ${progress.percentage}%. You need at least 80% completion to claim your certificate.`
    );
  }

  // Assign grade based on progress
  let grade = "Pass";
  if (progress.percentage >= 95) grade = "Distinction";
  else if (progress.percentage >= 85) grade = "Merit";

  let uniqueNumber = generateCertificateNumber();
  while (await Certificate.findOne({ certificateNumber: uniqueNumber })) {
    uniqueNumber = generateCertificateNumber();
  }

  certificate = await Certificate.create({
    certificateNumber: uniqueNumber,
    studentId,
    courseId: enrollment.courseId._id,
    classId,
    issueDate: new Date(),
    completionPercentage: progress.percentage,
    grade,
  });

  // Notify student
  try {
    await NotificationService.createNotification({
      recipient: studentId,
      recipientModel: "User",
      type: "course_update",
      title: "🎓 Certificate of Completion Issued!",
      message: `Congratulations! Your certificate for ${enrollment.courseId.title} is now ready for download (ID: ${uniqueNumber}).`,
      data: { certificateId: certificate._id, certificateNumber: uniqueNumber },
    });
  } catch (err) {
    // Non-blocking
  }

  const populated = await Certificate.findById(certificate._id)
    .populate("studentId", "fullName email avatar")
    .populate("courseId", "title slug category thumbnail duration durationUnit")
    .populate("classId", "batchName startDate endDate");

  return populated;
};

const getMyCertificates = async (studentId) => {
  const certificates = await Certificate.find({
    studentId,
    isRevoked: { $ne: true },
  })
    .populate("studentId", "fullName email avatar")
    .populate("courseId", "title slug category thumbnail duration durationUnit")
    .populate("classId", "batchName startDate endDate")
    .sort({ issueDate: -1 });

  return certificates;
};

const getCertificateByClass = async (studentId, classId) => {
  const certificate = await Certificate.findOne({
    studentId,
    classId,
    isRevoked: { $ne: true },
  })
    .populate("studentId", "fullName email avatar")
    .populate("courseId", "title slug category thumbnail duration durationUnit")
    .populate("classId", "batchName startDate endDate");

  return certificate;
};

const verifyCertificate = async (certificateNumber) => {
  const cleanNumber = String(certificateNumber || "").trim().toUpperCase();
  const certificate = await Certificate.findOne({
    certificateNumber: cleanNumber,
  })
    .populate("studentId", "fullName avatar")
    .populate("courseId", "title slug category thumbnail duration durationUnit")
    .populate("classId", "batchName startDate endDate");

  if (!certificate) {
    throw new ApiError(404, "Certificate not found or invalid certificate identifier.");
  }

  return {
    valid: !certificate.isRevoked,
    certificateNumber: certificate.certificateNumber,
    issueDate: certificate.issueDate,
    grade: certificate.grade,
    completionPercentage: certificate.completionPercentage,
    recipient: {
      fullName: certificate.studentId?.fullName,
      avatar: certificate.studentId?.avatar,
    },
    course: {
      title: certificate.courseId?.title,
      category: certificate.courseId?.category,
      duration: `${certificate.courseId?.duration} ${certificate.courseId?.durationUnit || 'months'}`,
    },
    class: {
      batchName: certificate.classId?.batchName,
    },
    isRevoked: certificate.isRevoked,
    revokedReason: certificate.revokedReason,
  };
};

const getAllCertificates = async (query = {}) => {
  const certificates = await Certificate.find({ isRevoked: { $ne: true } })
    .populate("studentId", "fullName email")
    .populate("courseId", "title category")
    .populate("classId", "batchName")
    .sort({ issueDate: -1 });

  return certificates;
};

export const CertificateService = {
  calculateStudentProgress,
  generateCertificate,
  getMyCertificates,
  getCertificateByClass,
  verifyCertificate,
  getAllCertificates,
};
