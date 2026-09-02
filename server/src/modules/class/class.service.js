import Class from "./class.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import SavedCourse from "../saved-course/saved-course.model.js";
import { NotificationService } from "../notification/notification.service.js";
import { NOTIFICATION_TYPE } from "../notification/notification.constant.js";
import sendEmail from "../../utils/email/sendEmail.js";
import { notificationEmailTemplates } from "../../utils/email/notification.templates.js";
import env from "../../config/env.js";
import ApiError from "../../shared/ApiError.js";
import logger from "../../shared/logger.js";



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

const createClass = async (payload, createdBy) => {
  await validateTeacher(payload.teacherId);
  await validateCourse(payload.courseId);
  await checkDuplicateBatchName(payload.batchName, payload.courseId);

  const classDoc = await Class.create({
    ...payload,
    createdBy,
  });

  // Auto-assign any existing unassigned enrollments for this course
  const unassigned = await Enrollment.find({
    courseId: payload.courseId,
    $or: [{ classId: null }, { classId: { $exists: false } }],
    isDeleted: { $ne: true },
  });

  if (unassigned.length > 0) {
    const capacityLimit = classDoc.capacity || 50;
    const toAssign = unassigned.slice(0, capacityLimit);
    const ids = toAssign.map((e) => e._id);
    await Enrollment.updateMany({ _id: { $in: ids } }, { classId: classDoc._id });
    await Class.findByIdAndUpdate(classDoc._id, { $inc: { currentStudents: ids.length } });
  }

  // Notify all students who saved this course that a new class batch is available
  try {
    const savedEntries = await SavedCourse.find({
      courseId: payload.courseId,
    }).populate("studentId", "fullName email");

    if (savedEntries.length > 0) {
      const course = await Course.findById(payload.courseId);
      const validEntries = savedEntries.filter(
        (entry) => entry.studentId && entry.studentId._id
      );

      const notifications = validEntries.map((entry) => ({
        recipientId: entry.studentId._id,
        type: NOTIFICATION_TYPE.COURSE_BATCH_AVAILABLE,
        title: `New Batch Open for ${course?.title || "Course"}`,
        message: `Class batch "${classDoc.batchName}" is now open for enrollment in "${course?.title || "your saved course"}". Enroll now!`,
        data: {
          courseId: course?._id,
          courseSlug: course?.slug,
          classId: classDoc._id,
          batchName: classDoc.batchName,
        },
        resourceId: classDoc._id.toString(),
        createdBy,
      }));

      if (notifications.length > 0) {
        await NotificationService.bulkCreateNotifications(notifications);
        await SavedCourse.updateMany(
          { courseId: payload.courseId },
          { isNotified: true }
        );
      }

      // Send Email notifications asynchronously to each saved student
      const clientBase = env.clientUrl || "http://localhost:5173";
      const courseUrl = course?.slug
        ? `${clientBase}/courses/${course.slug}`
        : `${clientBase}/courses`;

      for (const entry of validEntries) {
        const student = entry.studentId;
        if (student && student.email) {
          try {
            await sendEmail({
              to: student.email,
              subject: `New Class Batch Open: ${course?.title || "Course"}`,
              html: notificationEmailTemplates[NOTIFICATION_TYPE.COURSE_BATCH_AVAILABLE](
                student.fullName || "Student",
                {
                  courseTitle: course?.title || "Course",
                  batchName: classDoc.batchName,
                  courseUrl,
                }
              ),
            });
          } catch (emailErr) {
            logger.warn(`[ClassService] Failed to send batch email to ${student.email}: ${emailErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error(`[ClassService] Failed to notify saved course students: ${err.message}`);
  }


  const populated = await Class.findById(classDoc._id)
    .populate("courseId", "title slug")
    .populate("teacherId", "fullName email avatar")
    .select("-isDeleted -deletedAt");

  return populated;
};




const getClasses = async (query, user) => {
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

  // Only the assigned teacher can view their classes:
  if (user && user.role === USER_ROLE.TEACHER) {
    filter.teacherId = user._id;
  } else if (teacherId) {
    filter.teacherId = teacherId;
  }

  if (search) {
    filter.batchName = { $regex: search, $options: "i" };
  }

  if (courseId) {
    filter.courseId = courseId;
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
      .populate("teacherId", "fullName email avatar")
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

const getClassById = async (id, user) => {
  const classDoc = await Class.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate("courseId", "title slug")
    .populate("teacherId", "fullName email avatar")
    .select("-isDeleted -deletedAt");

  if (!classDoc) {
    throw new ApiError(404, CLASS_MESSAGES.CLASS_NOT_FOUND);
  }

  // Only the assigned teacher can access this specific class:
  if (user && user.role === USER_ROLE.TEACHER) {
    const assignedTeacherId = classDoc.teacherId?._id
      ? classDoc.teacherId._id.toString()
      : classDoc.teacherId?.toString();
    if (assignedTeacherId !== user._id.toString()) {
      throw new ApiError(403, "Access denied. You are not assigned to this class.");
    }
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
    .populate("teacherId", "fullName email avatar")
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
