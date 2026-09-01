import mongoose from "mongoose";
import Notice from "./notice.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS,
} from "../enrollment/enrollment.constant.js";
import { NOTICE_MESSAGES } from "./notice.constant.js";

const createNotice = async (payload, createdBy, userRole) => {
  const {
    courseId,
    classId,
    teacherId,
    targetAudience,
    title,
    description,
    attachmentUrl,
    isPinned,
    priority,
    publishDate,
    expiryDate,
  } = payload;

  let resolvedTeacherId = teacherId || null;
  let resolvedTargetAudience = targetAudience || "all";

  if (userRole === USER_ROLE.TEACHER) {
    if (!classId) {
      throw new ApiError(400, "Class is required for teacher notices");
    }

    const isOwnClass = await Class.findOne({
      _id: classId,
      teacherId: createdBy,
      isDeleted: { $ne: true },
    });

    if (!isOwnClass) {
      throw new ApiError(403, NOTICE_MESSAGES.UNAUTHORIZED_TEACHER);
    }

    resolvedTeacherId = createdBy;
    resolvedTargetAudience = "students";
  }

  if (courseId) {
    const course = await Course.findOne({
      _id: courseId,
      isDeleted: { $ne: true },
    });

    if (!course) {
      throw new ApiError(404, "Course not found");
    }
  }

  if (classId) {
    const cls = await Class.findOne({
      _id: classId,
      isDeleted: { $ne: true },
    });

    if (!cls) {
      throw new ApiError(404, "Class not found");
    }
    if (!resolvedTeacherId && cls.teacherId) {
      resolvedTeacherId = cls.teacherId;
    }
  }

  if (resolvedTeacherId) {
    const teacher = await User.findOne({
      _id: resolvedTeacherId,
      role: USER_ROLE.TEACHER,
      isDeleted: { $ne: true },
    });

    if (!teacher) {
      throw new ApiError(404, "Teacher not found");
    }
  }

  const notice = await Notice.create({
    courseId: courseId || null,
    classId: classId || null,
    teacherId: resolvedTeacherId || null,
    targetAudience: resolvedTargetAudience,
    title,
    description: description || "",
    attachmentUrl: attachmentUrl || "",
    isPinned: Boolean(isPinned),
    priority: priority || "medium",
    publishDate: publishDate || new Date(),
    expiryDate: expiryDate || null,
    createdBy,
  });

  const populated = await Notice.findById(notice._id)
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email avatar")
    .populate("createdBy", "fullName email role");

  return populated;
};

const getNotices = async (userId, userRole) => {
  const filter = { isDeleted: { $ne: true } };

  if (userRole === USER_ROLE.ADMIN) {
    // Admin sees all notices
  } else if (userRole === USER_ROLE.TEACHER) {
    filter.$or = [
      { teacherId: userId },
      { classId: null, targetAudience: { $in: ["all", "teachers"] } },
    ];
  } else if (userRole === USER_ROLE.STUDENT) {
    const enrolledClassIds = await Enrollment.find({
      studentId: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    }).distinct("classId");

    filter.$or = [
      { classId: { $in: enrolledClassIds } },
      { classId: null, courseId: null, targetAudience: { $in: ["all", "students"] } },
    ];
  }

  const notices = await Notice.find(filter)
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email avatar")
    .populate("createdBy", "fullName email role")
    .sort({ isPinned: -1, publishDate: -1, createdAt: -1 });

  return notices;
};


const getNoticeById = async (id, userId, userRole) => {
  const notice = await Notice.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email");

  if (!notice) {
    throw new ApiError(404, NOTICE_MESSAGES.NOTICE_NOT_FOUND);
  }

  if (userRole === USER_ROLE.ADMIN) {
    return notice;
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (notice.teacherId?._id?.toString() !== userId.toString()) {
      throw new ApiError(403, NOTICE_MESSAGES.UNAUTHORIZED_TEACHER);
    }
    return notice;
  }


  if (userRole === USER_ROLE.STUDENT) {
    if (notice.classId && notice.classId._id) {
      const enrolled = await Enrollment.findOne({
        studentId: userId,
        classId: notice.classId._id,
        status: ENROLLMENT_STATUS.ACTIVE,
        paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
        isDeleted: { $ne: true },
      });

      if (!enrolled) {
        throw new ApiError(403, NOTICE_MESSAGES.UNAUTHORIZED_STUDENT);
      }
    }
    return notice;
  }

  throw new ApiError(403, "You are not authorized to access this notice");
};

const updateNotice = async (id, payload, userId, userRole) => {
  const notice = await Notice.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!notice) {
    throw new ApiError(404, NOTICE_MESSAGES.NOTICE_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (notice.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, NOTICE_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const updatedNotice = await Notice.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email");

  return updatedNotice;
};

const deleteNotice = async (id, userId, userRole) => {
  const notice = await Notice.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!notice) {
    throw new ApiError(404, NOTICE_MESSAGES.NOTICE_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (notice.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, NOTICE_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  await Notice.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: NOTICE_MESSAGES.NOTICE_DELETED };
};

export const NoticeService = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
