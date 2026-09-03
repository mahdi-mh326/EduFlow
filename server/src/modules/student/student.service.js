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

export const StudentService = {
  getStudentDashboard,
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  getStudentsStats,
};

