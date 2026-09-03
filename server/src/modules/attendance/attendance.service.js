import mongoose from "mongoose";
import Attendance from "./attendance.model.js";
import LiveSession from "../live-session/live-session.model.js";
import Class from "../class/class.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS,
} from "../enrollment/enrollment.constant.js";
import { LIVE_SESSION_STATUS } from "../live-session/live-session.constant.js";
import { ATTENDANCE_MESSAGES, ATTENDANCE_STATUS } from "./attendance.constant.js";

const validateTeacher = async (teacherId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: USER_ROLE.TEACHER,
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });

  if (!teacher) {
    throw new ApiError(404, ATTENDANCE_MESSAGES.TEACHER_NOT_FOUND);
  }

  return teacher;
};

const validateLiveSession = async (liveSessionId) => {
  const session = await LiveSession.findOne({
    _id: liveSessionId,
    isDeleted: { $ne: true },
  });

  if (!session) {
    throw new ApiError(404, ATTENDANCE_MESSAGES.LIVE_SESSION_NOT_FOUND);
  }

  return session;
};

const validateClass = async (classId) => {
  const cls = await Class.findOne({
    _id: classId,
    isDeleted: { $ne: true },
  });

  if (!cls) {
    throw new ApiError(404, ATTENDANCE_MESSAGES.CLASS_NOT_FOUND);
  }

  return cls;
};

const validateCourse = async (courseId) => {
  const course = await Course.findOne({
    _id: courseId,
    status: COURSE_STATUS.PUBLISHED,
    isDeleted: { $ne: true },
  });

  if (!course) {
    throw new ApiError(404, ATTENDANCE_MESSAGES.COURSE_NOT_FOUND);
  }

  return course;
};

const validateTeacherOwnership = async (classId, teacherId) => {
  const cls = await Class.findOne({
    _id: classId,
    teacherId,
    isDeleted: { $ne: true },
  });

  if (!cls) {
    throw new ApiError(403, ATTENDANCE_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  return cls;
};

const recordLiveJoinAttendance = async ({
  liveSessionId,
  classId,
  courseId,
  teacherId,
  studentId,
}) => {
  if (!liveSessionId || !studentId) return null;

  // Check if attendance is already recorded for this live session and student
  let attendance = await Attendance.findOne({
    liveSessionId,
    studentId,
    isDeleted: { $ne: true },
  });

  if (attendance) {
    if (!attendance.checkInTime) {
      attendance.checkInTime = new Date();
      await attendance.save();
    }
    return attendance;
  }

  // Create new presence record
  attendance = await Attendance.create({
    liveSessionId,
    courseId,
    classId,
    teacherId,
    studentId,
    attendanceDate: new Date(),
    status: ATTENDANCE_STATUS.PRESENT,
    checkInTime: new Date(),
    remarks: "Auto-recorded on live class join",
    createdBy: teacherId,
  });

  return attendance;
};

const startAttendance = async (liveSessionId, teacherId) => {
  const session = await validateLiveSession(liveSessionId);
  await validateClass(session.classId);
  await validateCourse(session.courseId);
  await validateTeacherOwnership(session.classId, teacherId);

  const enrollments = await Enrollment.find({
    classId: session.classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email phone")
    .sort({ enrolledAt: 1 });

  // Check existing attendance records (e.g. from live session join or prior submission)
  const existingRecords = await Attendance.find({
    liveSessionId,
    isDeleted: { $ne: true },
  });
  const statusMap = new Map(existingRecords.map((r) => [r.studentId.toString(), r.status]));

  const students = enrollments
    .filter((e) => e.studentId && e.studentId._id)
    .map((enrollment) => ({
      _id: enrollment.studentId._id,
      fullName: enrollment.studentId.fullName,
      email: enrollment.studentId.email,
      phone: enrollment.studentId.phone,
      status: statusMap.get(enrollment.studentId._id.toString()) || ATTENDANCE_STATUS.PRESENT,
    }));

  return {
    liveSession: {
      _id: session._id,
      title: session.title,
      scheduledDate: session.scheduledDate,
      startTime: session.startTime,
      endTime: session.endTime,
    },
    classId: session.classId,
    courseId: session.courseId,
    teacherId: session.teacherId,
    students,
    totalStudents: students.length,
    hasExistingAttendance: existingRecords.length > 0,
  };
};

const submitAttendance = async (liveSessionId, students, teacherId) => {
  const session = await validateLiveSession(liveSessionId);
  await validateClass(session.classId);
  await validateCourse(session.courseId);
  await validateTeacherOwnership(session.classId, teacherId);

  const enrolledStudentIds = await Enrollment.find({
    classId: session.classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  }).distinct("studentId");

  const sessionStudentIds = new Set(enrolledStudentIds.map((id) => id.toString()));

  const createdOrUpdatedAttendances = [];
  for (const student of students) {
    if (!sessionStudentIds.has(student.studentId)) {
      continue;
    }

    const checkInTime =
      student.checkInTime || (student.status === ATTENDANCE_STATUS.PRESENT ? new Date() : null);

    const record = await Attendance.findOneAndUpdate(
      { liveSessionId, studentId: student.studentId },
      {
        $set: {
          status: student.status,
          remarks: student.remarks || "",
          checkInTime,
          attendanceDate: new Date(),
          isDeleted: false,
        },
        $setOnInsert: {
          courseId: session.courseId,
          classId: session.classId,
          teacherId,
          createdBy: teacherId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    createdOrUpdatedAttendances.push(record);
  }

  return createdOrUpdatedAttendances;
};


const updateAttendance = async (id, payload, teacherId) => {
  const attendance = await Attendance.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!attendance) {
    throw new ApiError(404, ATTENDANCE_MESSAGES.ATTENDANCE_NOT_FOUND);
  }

  if (attendance.teacherId.toString() !== teacherId.toString()) {
    throw new ApiError(403, ATTENDANCE_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("studentId", "fullName email phone")
    .populate("teacherId", "fullName email")
    .populate("courseId", "title slug")
    .populate("classId", "batchName");

  return updatedAttendance;
};

const getStudentAttendance = async (studentId, page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [countResult, attendances] = await Promise.all([
    Attendance.countDocuments({ studentId, isDeleted: { $ne: true } }),
    Attendance.find({ studentId, isDeleted: { $ne: true } })
      .sort({ attendanceDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("courseId", "title slug")
      .populate("classId", "batchName")
      .populate("teacherId", "fullName email")
      .populate("liveSessionId", "title scheduledDate startTime endTime"),
  ]);

  const total = countResult;
  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    data: attendances.map((attendance) => ({
      _id: attendance._id,
      course: attendance.courseId,
      class: attendance.classId,
      teacher: attendance.teacherId,
      liveSession: attendance.liveSessionId,
      attendanceDate: attendance.attendanceDate,
      status: attendance.status,
      checkInTime: attendance.checkInTime,
      remarks: attendance.remarks,
    })),
  };
};

const getAttendances = async (query) => {
  const {
    page = 1,
    limit = 10,
    courseId,
    teacherId,
    studentId,
    date,
    sortBy = "newest",
    sortOrder = "desc",
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: { $ne: true } };

  if (courseId) filter.courseId = courseId;
  if (teacherId) filter.teacherId = teacherId;
  if (studentId) filter.studentId = studentId;
  if (date) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.attendanceDate = { $gte: startOfDay, $lte: endOfDay };
  }

  let sort = {};
  switch (sortBy) {
    case "date":
      sort = { attendanceDate: sortOrder === "asc" ? 1 : -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
  }

  const [countResult, attendances] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("studentId", "fullName email phone")
      .populate("teacherId", "fullName email")
      .populate("courseId", "title slug")
      .populate("classId", "batchName")
      .populate("liveSessionId", "title scheduledDate"),
  ]);

  const total = countResult;
  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    attendances,
  };
};

const getAttendanceReport = async (query) => {
  const { courseId, teacherId, studentId, date } = query;

  const filter = { isDeleted: { $ne: true } };

  if (courseId) filter.courseId = courseId;
  if (teacherId) filter.teacherId = teacherId;
  if (studentId) filter.studentId = studentId;
  if (date) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.attendanceDate = { $gte: startOfDay, $lte: endOfDay };
  }

  const [
    totalClasses,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
  ] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.countDocuments({ ...filter, status: ATTENDANCE_STATUS.PRESENT }),
    Attendance.countDocuments({ ...filter, status: ATTENDANCE_STATUS.ABSENT }),
    Attendance.countDocuments({ ...filter, status: ATTENDANCE_STATUS.LATE }),
    Attendance.countDocuments({ ...filter, status: ATTENDANCE_STATUS.EXCUSED }),
  ]);

  const attendancePercentage = totalClasses > 0
    ? ((presentCount + lateCount) / totalClasses) * 100
    : 0;

  return {
    totalClasses,
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    excused: excusedCount,
    attendancePercentage: Math.round(attendancePercentage * 100) / 100,
  };
};

const submitClassAttendance = async (classId, teacherId, payload) => {

  const cls = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
  if (!cls) throw new ApiError(404, "Class not found");

  if (cls.teacherId.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You are not authorized to take attendance for this class.");
  }

  const { attendanceDate, students, liveSessionId } = payload;
  const dateObj = attendanceDate ? new Date(attendanceDate) : new Date();

  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  await Attendance.deleteMany({
    classId,
    attendanceDate: { $gte: startOfDay, $lte: endOfDay },
  });

  const docs = (students || []).map((s) => ({
    courseId: cls.courseId,
    classId,
    teacherId,
    studentId: s.studentId,
    liveSessionId: liveSessionId || null,
    status: s.status || ATTENDANCE_STATUS.PRESENT,
    attendanceDate: dateObj,
    remarks: s.remarks || "",
    createdBy: teacherId,
  }));

  if (docs.length > 0) {
    await Attendance.insertMany(docs);
  }

  return { message: "Attendance recorded successfully.", count: docs.length };
};

const getClassAttendanceHistory = async (classId, teacherId) => {
  const cls = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
  if (!cls) throw new ApiError(404, "Class not found");

  if (cls.teacherId.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You are not authorized to access this class attendance.");
  }

  const records = await Attendance.find({
    classId,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email avatar phone")
    .sort({ attendanceDate: -1, createdAt: -1 });

  return records;
};

export const AttendanceService = {
  recordLiveJoinAttendance,
  startAttendance,
  submitAttendance,
  updateAttendance,
  getStudentAttendance,
  getAttendances,
  getAttendanceReport,
  submitClassAttendance,
  getClassAttendanceHistory,
};


