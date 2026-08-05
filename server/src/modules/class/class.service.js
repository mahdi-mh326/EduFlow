import Class from "./class.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_MESSAGES } from "./class.constant.js";

const validateSections = (sections) => {
  if (!sections || sections.length === 0) return;

  if (sections.length > 3) {
    throw new ApiError(400, CLASS_MESSAGES.MAX_SECTIONS_EXCEEDED);
  }

  for (const section of sections) {
    if (section.capacity > 20) {
      throw new ApiError(400, CLASS_MESSAGES.SECTION_CAPACITY_EXCEEDED);
    }
    if (section.currentStudents > section.capacity) {
      throw new ApiError(400, CLASS_MESSAGES.CURRENT_STUDENTS_EXCEED_CAPACITY);
    }
  }
};

const validateTeacher = async (teacherId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: USER_ROLE.TEACHER,
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });
  if (!teacher) {
    throw new ApiError(404, CLASS_MESSAGES.TEACHER_NOT_FOUND);
  }
  return teacher;
};

const validateCourse = async (courseId) => {
  const course = await Course.findOne({
    _id: courseId,
    status: COURSE_STATUS.PUBLISHED,
    isDeleted: { $ne: true },
  });
  if (!course) {
    throw new ApiError(404, CLASS_MESSAGES.COURSE_NOT_FOUND);
  }
  return course;
};

const checkDuplicateBatchName = async (batchName, courseId, excludeId = null) => {
  const filter = {
    batchName,
    courseId,
    isDeleted: { $ne: true },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existing = await Class.findOne(filter).select("_id").lean();
  if (existing) {
    throw new ApiError(409, CLASS_MESSAGES.DUPLICATE_BATCH_NAME);
  }
};

const autoSections = [
  { name: "A", capacity: 20, currentStudents: 0, status: "active" },
  { name: "B", capacity: 20, currentStudents: 0, status: "active" },
  { name: "C", capacity: 20, currentStudents: 0, status: "active" },
];

const createClass = async (payload, createdBy) => {
  await validateTeacher(payload.teacherId);
  await validateCourse(payload.courseId);
  await checkDuplicateBatchName(payload.batchName, payload.courseId);

  const classDoc = await Class.create({
    ...payload,
    sections: autoSections,
    createdBy,
  });

  const populated = await Class.findById(classDoc._id)
    .populate("courseId", "title slug")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  return populated;
};

const getClasses = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    courseId,
    teacherId,
    status,
    sortBy = "newest",
    sortOrder = "desc",
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: { $ne: true } };

  if (search) {
    filter.batchName = { $regex: search, $options: "i" };
  }

  if (courseId) {
    filter.courseId = courseId;
  }

  if (teacherId) {
    filter.teacherId = teacherId;
  }

  if (status) {
    filter.status = status;
  }

  let sort = {};
  switch (sortBy) {
    case "startDate":
      sort = { startDate: sortOrder === "asc" ? 1 : -1 };
      break;
    case "batchName":
      sort = { batchName: sortOrder === "asc" ? 1 : -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: -1 };
      break;
  }

  const [countResult, classes] = await Promise.all([
    Class.countDocuments(filter),
    Class.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("courseId", "title slug")
      .populate("teacherId", "fullName email")
      .select("-isDeleted -deletedAt"),
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
    classes,
  };
};

const getClassById = async (id) => {
  const classDoc = await Class.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate("courseId", "title slug")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  if (!classDoc) {
    throw new ApiError(404, CLASS_MESSAGES.CLASS_NOT_FOUND);
  }

  return classDoc;
};

const updateClass = async (id, payload) => {
  const classDoc = await Class.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!classDoc) {
    throw new ApiError(404, CLASS_MESSAGES.CLASS_NOT_FOUND);
  }

  if (payload.teacherId) {
    await validateTeacher(payload.teacherId);
  }

  if (payload.courseId) {
    await validateCourse(payload.courseId);
  }

  if (payload.batchName || payload.courseId) {
    const targetBatchName = payload.batchName || classDoc.batchName;
    const targetCourseId = payload.courseId || classDoc.courseId;
    await checkDuplicateBatchName(targetBatchName, targetCourseId, id);
  }

  if (payload.sections) {
    delete payload.sections;
  }

  const updatedClass = await Class.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("teacherId", "fullName email")
    .select("-isDeleted -deletedAt");

  return updatedClass;
};

const softDeleteClass = async (id) => {
  const classDoc = await Class.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!classDoc) {
    throw new ApiError(404, CLASS_MESSAGES.CLASS_NOT_FOUND);
  }

  await Class.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: CLASS_MESSAGES.CLASS_DELETED };
};

export const ClassService = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  softDeleteClass,
};
