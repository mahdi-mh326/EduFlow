import mongoose from "mongoose";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS,
} from "../enrollment/enrollment.constant.js";
import Quiz from "./quiz.model.js";
import Class from "../class/class.model.js";
import Course from "../course/course.model.js";
import User from "../user/user.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { QUIZ_MESSAGES, QUIZ_STATUS } from "./quiz.constant.js";

const validateTeacher = async (teacherId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: USER_ROLE.TEACHER,
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });
  if (!teacher) {
    throw new ApiError(404, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
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
    throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
  }
  return cls;
};

const createQuiz = async (payload, createdBy, callerRole) => {
  const { courseId, classId, title, description, instructions, durationMinutes, totalMarks, passingMarks, startDate, endDate, attemptLimit, status } = payload;

  await validateCourse(courseId);
  await validateClass(classId);

  if (callerRole === USER_ROLE.TEACHER) {
    const isOwnClass = await Class.findOne({
      _id: classId,
      teacherId: createdBy,
      isDeleted: { $ne: true },
    });

    if (!isOwnClass) {
      throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
    }

    payload.teacherId = createdBy;
  }

  await validateTeacher(payload.teacherId);

  if (new Date(endDate) <= new Date(startDate)) {
    throw new ApiError(400, QUIZ_MESSAGES.INVALID_DATE_RANGE);
  }

  if (passingMarks > totalMarks) {
    throw new ApiError(400, "Passing marks cannot exceed total marks");
  }

  const quiz = await Quiz.create({
    courseId,
    classId,
    teacherId: payload.teacherId,
    title,
    description: description || "",
    instructions: instructions || "",
    durationMinutes,
    totalMarks,
    passingMarks,
    startDate,
    endDate,
    attemptLimit,
    status: status || QUIZ_STATUS.DRAFT,
    createdBy,
  });

  const populated = await Quiz.findById(quiz._id)
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  return populated;
};

const getQuizzes = async (userId, userRole, query = {}) => {
  const { page = 1, limit = 10, search, classId, status, sortBy = "newest", sortOrder = "desc" } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: { $ne: true } };

  if (userRole === USER_ROLE.TEACHER) {
    filter.teacherId = userId;
  } else if (userRole === USER_ROLE.STUDENT) {
    const enrolledClassIds = await mongoose.model("Enrollment").distinct("classId", {
      studentId: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    });

    if (enrolledClassIds.length === 0) {
      return { meta: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 }, quizzes: [] };
    }

    filter.classId = { $in: enrolledClassIds };
    filter.status = QUIZ_STATUS.PUBLISHED;
  } else if (userRole === USER_ROLE.ADMIN) {
    // Admin sees all
  }

  if (classId) filter.classId = classId;
  if (status) filter.status = status;
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  let sort = {};
  switch (sortBy) {
    case "startDate":
      sort = { startDate: sortOrder === "asc" ? 1 : -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
  }

  const [countResult, quizzes] = await Promise.all([
    Quiz.countDocuments(filter),
    Quiz.find(filter)
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
    quizzes,
  };
};

const getQuizById = async (id, userId, userRole) => {
  const quiz = await Quiz.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  if (!quiz) {
    throw new ApiError(404, QUIZ_MESSAGES.QUIZ_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (quiz.teacherId._id.toString() !== userId.toString()) {
      throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  } else if (userRole === USER_ROLE.STUDENT) {
    if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
      throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
    }

    const enrolled = await mongoose.model("Enrollment").findOne({
      studentId: userId,
      classId: quiz.classId._id,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    });

    if (!enrolled) {
      throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_STUDENT);
    }
  }

  return quiz;
};

const updateQuiz = async (id, payload, userId, userRole) => {
  const quiz = await Quiz.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!quiz) {
    throw new ApiError(404, QUIZ_MESSAGES.QUIZ_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (quiz.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const updatedQuiz = await Quiz.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName startDate endDate")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  return updatedQuiz;
};

const deleteQuiz = async (id, userId, userRole) => {
  const quiz = await Quiz.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!quiz) {
    throw new ApiError(404, QUIZ_MESSAGES.QUIZ_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (quiz.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  await Quiz.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: QUIZ_MESSAGES.QUIZ_DELETED };
};

export const QuizService = {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
};
