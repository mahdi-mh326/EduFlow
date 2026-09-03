import mongoose from "mongoose";
import Enrollment from "../enrollment/enrollment.model.js";
import Class from "../class/class.model.js";
import Course from "../course/course.model.js";
import User from "../user/user.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.constant.js";
import Notification from "../notification/notification.model.js";
import { NOTIFICATION_TYPE } from "../notification/notification.constant.js";
import sendEmail from "../../utils/email/sendEmail.js";
import logger from "../../shared/logger.js";
import { STUDENT_MESSAGES } from "./student.constant.js";

const getStudentDashboard = async (studentId) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
    isVerified: true,
  }).select("-password -isDeleted -deletedAt");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const enrollments = await Enrollment.find({
    studentId,
    status: ENROLLMENT_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug thumbnail shortDescription price")
    .populate({
      path: "classId",
      select: "batchName startDate endDate teacherId sections",
      populate: {
        path: "teacherId",
        select: "fullName email",
      },
    })
    .sort({ enrolledAt: -1 });

  const enrolledCourses = enrollments.map((enrollment) => ({
    course: enrollment.courseId,
    batch: enrollment.classId?.batchName || null,
    section: enrollment.sectionId,
    teacher: enrollment.classId?.teacherId || null,
    enrollmentDate: enrollment.enrolledAt,
  }));

  return {
    student: {
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      avatar: student.avatar,
      gender: student.gender,
    },
    enrolledCourses,
    totalCourses: enrolledCourses.length,
  };
};

const getAllStudents = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
  };

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [students, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-password -refreshToken -otp -otpExpires")
      .lean(),
    User.countDocuments(filter),
  ]);

  // Aggregate enrollment count for these students
  const studentIds = students.map((s) => s._id);
  const enrollmentCounts = await Enrollment.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: "$studentId",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map(enrollmentCounts.map((e) => [e._id.toString(), e.count]));

  const data = students.map((student) => ({
    ...student,
    enrollmentCount: countMap.get(student._id.toString()) || 0,
  }));

  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    data,
  };
};

const getStudentById = async (studentId) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
  })
    .select("-password -refreshToken -otp -otpExpires")
    .lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const enrollments = await Enrollment.find({
    studentId,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug thumbnail price")
    .populate("classId", "batchName startDate endDate")
    .sort({ enrolledAt: -1 })
    .lean();

  return {
    ...student,
    enrollments,
    totalEnrollments: enrollments.length,
  };
};

const updateStudentStatus = async (studentId, status) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  student.status = status;
  await student.save();

  return {
    _id: student._id,
    fullName: student.fullName,
    email: student.email,
    status: student.status,
  };
};

const getStudentsStats = async () => {
  const [totalStudents, activeStudents, pendingStudents, blockedStudents] = await Promise.all([
    User.countDocuments({ role: USER_ROLE.STUDENT, isDeleted: { $ne: true } }),
    User.countDocuments({ role: USER_ROLE.STUDENT, status: USER_STATUS.ACTIVE, isDeleted: { $ne: true } }),
    User.countDocuments({ role: USER_ROLE.STUDENT, status: USER_STATUS.PENDING, isDeleted: { $ne: true } }),
    User.countDocuments({ role: USER_ROLE.STUDENT, status: USER_STATUS.BLOCKED, isDeleted: { $ne: true } }),
  ]);

  return {
    totalStudents,
    activeStudents,
    pendingStudents,
    blockedStudents,
  };
};

const deleteStudent = async (studentId) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  student.isDeleted = true;
  student.deletedAt = new Date();
  student.status = USER_STATUS.BLOCKED;
  await student.save();

  return { message: "Student account deleted successfully" };
};

const warnStudent = async (studentId, { title, message }, adminId) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (!message || !message.trim()) {
    throw new ApiError(400, "Warning message is required");
  }

  const warningTitle = title?.trim() || "Administrative Warning Notice";
  const warningMessage = message.trim();

  // Create In-App Notification
  const notification = await Notification.create({
    recipientId: student._id,
    type: NOTIFICATION_TYPE.WARNING || "warning",
    title: `⚠️ ${warningTitle}`,
    message: warningMessage,
    data: {
      warnedAt: new Date(),
      adminId,
    },
    createdBy: adminId,
  });

  // Attempt Email Notification
  try {
    await sendEmail({
      to: student.email,
      subject: `[EduFlow Notice] ${warningTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #dc2626; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">⚠️ Administrative Warning</h2>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <p>Dear <strong>${student.fullName}</strong>,</p>
            <p>You have received an official administrative warning from the EduFlow management team:</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 8px 0; color: #991b1b;">${warningTitle}</h4>
              <p style="margin: 0; color: #334155; line-height: 1.5;">${warningMessage}</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">Please review this notice and take any necessary corrective actions. Continued violations may result in account restriction or suspension.</p>
            <p style="margin-top: 24px; font-size: 13px; color: #64748b;">Best regards,<br/>EduFlow Administration</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    logger.error(`Failed to send warning email to [${student.email}]: ${err.message}`);
  }

  return {
    success: true,
    message: "Warning sent successfully to the student",
    notification,
  };
};

export const StudentService = {
  getStudentDashboard,
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  getStudentsStats,
  deleteStudent,
  warnStudent,
};


