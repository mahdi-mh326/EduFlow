import mongoose from "mongoose";
import LiveSession from "./live-session.model.js";
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
import { LIVE_SESSION_MESSAGES, LIVE_SESSION_STATUS } from "./live-session.constant.js";

const generateMeetingRoom = (batchName, scheduledDate) => {
  const sanitizedBatch = String(batchName)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const datePart = new Date(scheduledDate).toISOString().slice(0, 10).replace(/-/g, "");
  return `eduflow-mern-${sanitizedBatch}-${datePart}`;
};

const validateTeacher = async (teacherId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: USER_ROLE.TEACHER,
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });

  if (!teacher) {
    throw new ApiError(404, LIVE_SESSION_MESSAGES.TEACHER_NOT_FOUND);
  }

  return teacher;
};

const validateClass = async (classId) => {
  const cls = await Class.findOne({
    _id: classId,
    isDeleted: { $ne: true },
  });

  if (!cls) {
    throw new ApiError(404, LIVE_SESSION_MESSAGES.CLASS_NOT_FOUND);
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
    throw new ApiError(404, LIVE_SESSION_MESSAGES.COURSE_NOT_FOUND);
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
    throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  return cls;
};

const isSessionPast = (scheduledDate, startTime, endTime) => {
  const now = new Date();
  const sessionDate = new Date(scheduledDate);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startDateTime = new Date(sessionDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);

  const endDateTime = new Date(sessionDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  return now > endDateTime;
};

const createLiveSession = async (payload, createdBy, userRole) => {
  const {
    courseId, classId, teacherId, title, description, scheduledDate, startTime, endTime, status,
  } = payload;

  if (userRole === USER_ROLE.TEACHER) {
    await validateTeacherOwnership(classId, createdBy);
    payload.teacherId = createdBy;
  }

  const cls = await validateClass(classId);
  await validateCourse(courseId);
  await validateTeacher(payload.teacherId);

  if (isSessionPast(scheduledDate, startTime, endTime)) {
    throw new ApiError(400, LIVE_SESSION_MESSAGES.INVALID_SCHEDULE);
  }

  const meetingRoom = generateMeetingRoom(cls.batchName, scheduledDate);
  const meetingUrl = `https://meet.jit.si/${meetingRoom}`;

  const session = await LiveSession.create({
    courseId,
    classId,
    teacherId: payload.teacherId,
    title,
    description: description || "",
    meetingRoom,
    meetingUrl,
    scheduledDate,
    startTime,
    endTime,
    status: status || LIVE_SESSION_STATUS.SCHEDULED,
    createdBy,
  });

  return session;
};

const getLiveSessions = async (userId, userRole) => {
  const filter = { isDeleted: { $ne: true } };

  if (userRole === USER_ROLE.ADMIN) {
    // Admin sees all sessions
  } else if (userRole === USER_ROLE.TEACHER) {
    filter.teacherId = userId;
  } else if (userRole === USER_ROLE.STUDENT) {
    const enrolledClassIds = await Enrollment.find({
      studentId: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    }).distinct("classId");

    if (enrolledClassIds.length === 0) {
      return [];
    }

    filter.classId = { $in: enrolledClassIds };
  }

  const sessions = await LiveSession.find(filter)
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .sort({ scheduledDate: 1, startTime: 1 });

  return sessions;
};

const getLiveSessionById = async (id, userId, userRole) => {
  const session = await LiveSession.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email");

  if (!session) {
    throw new ApiError(404, LIVE_SESSION_MESSAGES.SESSION_NOT_FOUND);
  }

  if (userRole === USER_ROLE.ADMIN) {
    return session;
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (session.teacherId._id.toString() !== userId.toString()) {
      throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
    }
    return session;
  }

  if (userRole === USER_ROLE.STUDENT) {
    const enrolled = await Enrollment.findOne({
      studentId: userId,
      classId: session.classId._id,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    });

    if (!enrolled) {
      throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
    }
    return session;
  }

  throw new ApiError(403, "You are not authorized to access this session");
};

const updateLiveSession = async (id, payload, userId, userRole) => {
  const session = await LiveSession.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!session) {
    throw new ApiError(404, LIVE_SESSION_MESSAGES.SESSION_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (session.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  if (isSessionPast(session.scheduledDate, session.startTime, session.endTime)) {
    throw new ApiError(400, LIVE_SESSION_MESSAGES.PAST_SESSION);
  }

  if (payload.classId) {
    await validateClass(payload.classId);
  }

  if (payload.courseId) {
    await validateCourse(payload.courseId);
  }

  if (payload.teacherId) {
    await validateTeacher(payload.teacherId);
  }

  if (payload.scheduledDate || payload.startTime || payload.endTime) {
    const targetScheduledDate = payload.scheduledDate || session.scheduledDate;
    const targetStartTime = payload.startTime || session.startTime;
    const targetEndTime = payload.endTime || session.endTime;

    if (isSessionPast(targetScheduledDate, targetStartTime, targetEndTime)) {
      throw new ApiError(400, LIVE_SESSION_MESSAGES.INVALID_SCHEDULE);
    }
  }

  const updatedSession = await LiveSession.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email");

  return updatedSession;
};

const deleteLiveSession = async (id, userId, userRole) => {
  const session = await LiveSession.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!session) {
    throw new ApiError(404, LIVE_SESSION_MESSAGES.SESSION_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (session.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  await LiveSession.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    status: LIVE_SESSION_STATUS.CANCELLED,
  });

  return { message: LIVE_SESSION_MESSAGES.SESSION_DELETED, session };
};

const getStudentLiveSessions = async (studentId) => {
  const enrolledClassIds = await Enrollment.find({
    studentId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  }).distinct("classId");

  if (enrolledClassIds.length === 0) {
    return [];
  }

  const sessions = await LiveSession.find({
    classId: { $in: enrolledClassIds },
    status: { $in: [LIVE_SESSION_STATUS.SCHEDULED, LIVE_SESSION_STATUS.LIVE] },
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .sort({ scheduledDate: 1, startTime: 1 });

  return sessions;
};

const startLiveSession = async (id, userId) => {
  const session = await LiveSession.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!session) {
    throw new ApiError(404, LIVE_SESSION_MESSAGES.SESSION_NOT_FOUND);
  }

  if (session.teacherId.toString() !== userId.toString()) {
    throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  if (session.status !== LIVE_SESSION_STATUS.SCHEDULED) {
    throw new ApiError(400, LIVE_SESSION_MESSAGES.INVALID_SESSION_STATUS);
  }

  const updatedSession = await LiveSession.findByIdAndUpdate(
    id,
    { $set: { status: LIVE_SESSION_STATUS.LIVE } },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email");

  return updatedSession;
};

const endLiveSession = async (id, userId) => {
  const session = await LiveSession.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!session) {
    throw new ApiError(404, LIVE_SESSION_MESSAGES.SESSION_NOT_FOUND);
  }

  if (session.teacherId.toString() !== userId.toString()) {
    throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  if (session.status !== LIVE_SESSION_STATUS.LIVE) {
    throw new ApiError(400, LIVE_SESSION_MESSAGES.INVALID_SESSION_STATUS);
  }

  const updatedSession = await LiveSession.findByIdAndUpdate(
    id,
    { $set: { status: LIVE_SESSION_STATUS.COMPLETED } },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email");

  return updatedSession;
};

const startClassLive = async (classId, teacherId) => {
  const cls = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
  if (!cls) throw new ApiError(404, LIVE_SESSION_MESSAGES.CLASS_NOT_FOUND);

  if (cls.teacherId.toString() !== teacherId.toString()) {
    throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  let session = await LiveSession.findOne({
    classId,
    teacherId,
    status: LIVE_SESSION_STATUS.LIVE,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email");

  if (session) {
    return session;
  }

  const today = new Date();
  const startTime = cls.startTime || "10:00";
  const endTime = cls.endTime || "11:30";
  const meetingRoom = generateMeetingRoom(cls.batchName, today);
  const meetingUrl = `https://meet.jit.si/${meetingRoom}`;

  session = await LiveSession.create({
    courseId: cls.courseId,
    classId,
    teacherId,
    title: `${cls.batchName} - Live Class`,
    description: `Live class session for ${cls.batchName}`,
    meetingRoom,
    meetingUrl,
    scheduledDate: today,
    startTime,
    endTime,
    status: LIVE_SESSION_STATUS.LIVE,
    createdBy: teacherId,
  });

  const populated = await LiveSession.findById(session._id)
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email");

  return populated;
};

const endClassLive = async (classId, teacherId) => {
  const cls = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
  if (!cls) throw new ApiError(404, LIVE_SESSION_MESSAGES.CLASS_NOT_FOUND);

  if (cls.teacherId.toString() !== teacherId.toString()) {
    throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  await LiveSession.updateMany(
    { classId, teacherId, status: LIVE_SESSION_STATUS.LIVE, isDeleted: { $ne: true } },
    { $set: { status: LIVE_SESSION_STATUS.COMPLETED } }
  );

  return { message: "Live class ended successfully." };
};

const getActiveClassLive = async (classId, userId, userRole) => {
  const cls = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
  if (!cls) throw new ApiError(404, LIVE_SESSION_MESSAGES.CLASS_NOT_FOUND);

  if (userRole === USER_ROLE.TEACHER) {
    if (cls.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, LIVE_SESSION_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  } else if (userRole === USER_ROLE.STUDENT) {
    const isEnrolled = await Enrollment.findOne({
      studentId: userId,
      classId,
      status: ENROLLMENT_STATUS.ACTIVE,
      isDeleted: { $ne: true },
    });
    if (!isEnrolled) {
      throw new ApiError(403, "You are not enrolled in this class.");
    }
  }

  const session = await LiveSession.findOne({
    classId,
    status: LIVE_SESSION_STATUS.LIVE,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email");

  return session;
};

export const LiveSessionService = {
  createLiveSession,
  getLiveSessions,
  getLiveSessionById,
  updateLiveSession,
  deleteLiveSession,
  getStudentLiveSessions,
  startLiveSession,
  endLiveSession,
  startClassLive,
  endClassLive,
  getActiveClassLive,
};

