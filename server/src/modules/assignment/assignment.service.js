import mongoose from "mongoose";
import Assignment from "./assignment.model.js";
import Class from "../class/class.model.js";
import Course from "../course/course.model.js";
import User from "../user/user.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import { ENROLLMENT_STATUS, PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS } from "../enrollment/enrollment.constant.js";
import { ASSIGNMENT_MESSAGES, ASSIGNMENT_STATUS } from "./assignment.constant.js";

const validateTeacher = async (teacherId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: USER_ROLE.TEACHER,
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });
  if (!teacher) {
    throw new ApiError(404, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
  }
  return teacher;
};

const validateCourse = async (courseId) => {
  const course = await Course.findOne({
    _id: courseId,
    isDeleted: { $ne: true },
    status: COURSE_STATUS.PUBLISHED,
  });
  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  return course;
};

const validateClass = async (classId) => {
  const cls = await Class.findOne({
    _id: classId,
    isDeleted: { $ne: true },
  });
  if (!cls) {
    throw new ApiError(404, "Class not found");
  }
  return cls;
};

const validateTeacherOwnership = async (classId, teacherId) => {
  const cls = await Class.findOne({
    _id: classId,
    teacherId,
    isDeleted: { $ne: true },
  });
  if (!cls) {
    throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
  }
  return cls;
};

const createAssignment = async (payload, createdBy, callerRole) => {
  const { courseId, classId, teacherId, title, description, instructions, attachmentUrl, dueDate, totalMarks, status } = payload;

  await validateCourse(courseId);
  await validateClass(classId);

  if (callerRole === USER_ROLE.TEACHER) {
    const isOwnClass = await Class.findOne({
      _id: classId,
      teacherId: createdBy,
      isDeleted: { $ne: true },
    });

    if (!isOwnClass) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }

    payload.teacherId = createdBy;
  }

  await validateTeacher(payload.teacherId);

  const assignment = await Assignment.create({
    courseId,
    classId,
    teacherId: callerRole === USER_ROLE.TEACHER ? createdBy : teacherId,
    title,
    description: description || "",
    instructions: instructions || "",
    attachmentUrl: attachmentUrl || "",
    dueDate,
    totalMarks,
    status: status || ASSIGNMENT_STATUS.DRAFT,
    createdBy,
  });

  const populated = await Assignment.findById(assignment._id)
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  return populated;
};

const getAssignments = async (userId, userRole, query = {}) => {
  const { page = 1, limit = 10, search, classId, status, sortBy = "newest", sortOrder = "desc" } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: { $ne: true } };

  if (userRole === USER_ROLE.TEACHER) {
    filter.teacherId = userId;
  } else if (userRole === USER_ROLE.STUDENT) {
    const enrolledClassIds = await Enrollment.find({
      studentId: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    }).distinct("classId");

    if (enrolledClassIds.length === 0) {
      return { meta: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 }, assignments: [] };
    }

    filter.classId = { $in: enrolledClassIds };
    filter.status = ASSIGNMENT_STATUS.PUBLISHED;
  } else if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN) {
    // Admin sees all
  }

  if (classId) filter.classId = classId;
  if (status) filter.status = status;
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  let sort = {};
  switch (sortBy) {
    case "dueDate":
      sort = { dueDate: sortOrder === "asc" ? 1 : -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
  }

  const [countResult, assignments] = await Promise.all([
    Assignment.countDocuments(filter),
    Assignment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("courseId", "title slug")
      .populate("classId", "batchName startDate endDate")
      .populate("teacherId", "fullName email")
      .select("-isDeleted -deletedAt"),
  ]);

  const total = countResult;
  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: { total, page: pageNum, limit: limitNum, totalPages },
    assignments,
  };
};

const getAssignmentById = async (id, userId, userRole) => {
  const assignment = await Assignment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  if (!assignment) {
    throw new ApiError(404, ASSIGNMENT_MESSAGES.ASSIGNMENT_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (assignment.teacherId._id.toString() !== userId.toString()) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  } else if (userRole === USER_ROLE.STUDENT) {
    if (assignment.status !== ASSIGNMENT_STATUS.PUBLISHED) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }

    const enrolled = await Enrollment.findOne({
      studentId: userId,
      classId: assignment.classId._id,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    });

    if (!enrolled) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  return assignment;
};

const updateAssignment = async (id, payload, userId, userRole) => {
  const assignment = await Assignment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!assignment) {
    throw new ApiError(404, ASSIGNMENT_MESSAGES.ASSIGNMENT_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (assignment.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  if (payload.dueDate && new Date(payload.dueDate) <= new Date()) {
    throw new ApiError(400, ASSIGNMENT_MESSAGES.INVALID_DUE_DATE);
  }

  const updatedAssignment = await Assignment.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  return updatedAssignment;
};

const deleteAssignment = async (id, userId, userRole) => {
  const assignment = await Assignment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!assignment) {
    throw new ApiError(404, ASSIGNMENT_MESSAGES.ASSIGNMENT_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (assignment.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  await Assignment.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: ASSIGNMENT_MESSAGES.ASSIGNMENT_DELETED };
};

export const AssignmentService = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
