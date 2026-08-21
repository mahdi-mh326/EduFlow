import mongoose from "mongoose";
import Enrollment from "./enrollment.model.js";
import Class from "../class/class.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import { ENROLLMENT_MESSAGES, ENROLLMENT_STATUS, PAYMENT_STATUS } from "./enrollment.constant.js";

const findAvailableSection = (sections) => {
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].currentStudents < sections[i].capacity) {
      return { index: i, name: sections[i].name };
    }
  }
  return null;
};

const createEnrollment = async ({ courseId, studentId, paymentStatus }, createdBy, callerRole) => {
  if (callerRole === USER_ROLE.STUDENT && studentId !== createdBy) {
    throw new ApiError(403, "You can only create enrollment for yourself");
  }

  const student = await User.findOne({
    _id: studentId,
    isDeleted: { $ne: true },
    isVerified: true,
  });

  if (!student) {
    throw new ApiError(404, ENROLLMENT_MESSAGES.STUDENT_NOT_FOUND);
  }

  const course = await Course.findOne({
    _id: courseId,
    isDeleted: { $ne: true },
    status: COURSE_STATUS.PUBLISHED,
  });

  if (!course) {
    throw new ApiError(404, ENROLLMENT_MESSAGES.COURSE_NOT_FOUND);
  }

  const existingEnrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });

  if (existingEnrollment) {
    throw new ApiError(409, ENROLLMENT_MESSAGES.ENROLLMENT_ALREADY_EXISTS);
  }

  const session = await mongoose.startSession();
  try {
    let enrollment;
    await session.withTransaction(async () => {
      const classes = await Class.find({
        courseId,
        status: { $in: [CLASS_STATUS.UPCOMING, CLASS_STATUS.ONGOING] },
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: 1 })
        .session(session);

      let targetClass = null;
      let targetSectionIndex = null;

      for (const cls of classes) {
        const available = findAvailableSection(cls.sections);
        if (available) {
          targetClass = cls;
          targetSectionIndex = available.index;
          break;
        }
      }

      if (!targetClass || targetSectionIndex === null) {
        throw new ApiError(400, ENROLLMENT_MESSAGES.CLASS_FULL);
      }

      await Class.findByIdAndUpdate(
        targetClass._id,
        { $inc: { [`sections.${targetSectionIndex}.currentStudents`]: 1 } },
        { session }
      );

      [enrollment] = await Enrollment.create(
        [
          {
            studentId,
            courseId,
            classId: targetClass._id,
            sectionId: targetClass.sections[targetSectionIndex].name,
            status: ENROLLMENT_STATUS.ACTIVE,
            paymentStatus: paymentStatus || PAYMENT_STATUS.PAID,
            createdBy,
          },
        ],
        { session }
      );
    });

    return enrollment;
  } finally {
    await session.endSession();
  }
};

const getEnrollments = async (userId, userRole) => {
  const filter = { isDeleted: { $ne: true } };

  if (userRole === USER_ROLE.STUDENT) {
    filter.studentId = userId;
  } else if (userRole === USER_ROLE.TEACHER) {
    const teacherClassIds = await Class.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    }).distinct("_id");
    filter.classId = { $in: teacherClassIds };
  } else if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN) {
    // Admin and Super Admin see all enrollments
  }

  const enrollments = await Enrollment.find(filter)
    .populate("studentId", "fullName email phone")
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

  return enrollments;
};

const getEnrollmentById = async (id, userId, userRole) => {
  const enrollment = await Enrollment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email phone")
    .populate("courseId", "title slug thumbnail shortDescription price")
    .populate({
      path: "classId",
      select: "batchName startDate endDate teacherId sections",
      populate: {
        path: "teacherId",
        select: "fullName email",
      },
    });

  if (!enrollment) {
    throw new ApiError(404, ENROLLMENT_MESSAGES.ENROLLMENT_NOT_FOUND);
  }

  if (userRole === USER_ROLE.STUDENT && enrollment.studentId._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this enrollment");
  }

  if (userRole === USER_ROLE.TEACHER && enrollment.classId.teacherId._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this enrollment");
  }

  return enrollment;
};

const deleteEnrollment = async (id) => {
  const enrollment = await Enrollment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!enrollment) {
    throw new ApiError(404, ENROLLMENT_MESSAGES.ENROLLMENT_NOT_FOUND);
  }

  await Enrollment.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    status: ENROLLMENT_STATUS.CANCELLED,
  });

  return { message: ENROLLMENT_MESSAGES.ENROLLMENT_DELETED };
};

export const EnrollmentService = {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  deleteEnrollment,
};
