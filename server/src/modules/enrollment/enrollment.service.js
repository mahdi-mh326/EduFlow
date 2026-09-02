import mongoose from "mongoose";
import Enrollment from "./enrollment.model.js";
import Class from "../class/class.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import SavedCourse from "../saved-course/saved-course.model.js";
import ApiError from "../../shared/ApiError.js";

import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import { ENROLLMENT_MESSAGES, ENROLLMENT_STATUS, PAYMENT_STATUS } from "./enrollment.constant.js";

const createEnrollment = async ({ courseId, classId, studentId, paymentStatus }, createdBy, callerRole) => {
  if (callerRole === USER_ROLE.STUDENT && studentId !== createdBy) {
    throw new ApiError(403, "You can only create enrollment for yourself");
  }

  if (callerRole === USER_ROLE.STUDENT && paymentStatus) {
    throw new ApiError(400, "Students cannot set payment status during enrollment");
  }

  const effectivePaymentStatus = callerRole === USER_ROLE.STUDENT
    ? PAYMENT_STATUS.PENDING
    : (paymentStatus || PAYMENT_STATUS.PENDING);

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

  if (callerRole === USER_ROLE.STUDENT && course.price && course.price > 0) {
    throw new ApiError(400, "Payment is required for this course. Please complete payment via the secure payment gateway to enroll.");
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
      let targetClass = null;

      if (classId) {
        targetClass = await Class.findOne({
          _id: classId,
          courseId,
          status: { $in: [CLASS_STATUS.UPCOMING, CLASS_STATUS.ONGOING] },
          isDeleted: { $ne: true },
        }).session(session);
      }

      if (!targetClass) {
        targetClass = await Class.findOne({
          courseId,
          status: { $in: [CLASS_STATUS.UPCOMING, CLASS_STATUS.ONGOING] },
          isDeleted: { $ne: true },
        })
          .sort({ createdAt: 1 })
          .session(session);
      }

      if (targetClass) {
        if (targetClass.capacity && targetClass.currentStudents >= targetClass.capacity) {
          throw new ApiError(400, ENROLLMENT_MESSAGES.CLASS_FULL);
        }

        await Class.findByIdAndUpdate(
          targetClass._id,
          { $inc: { currentStudents: 1 } },
          { session }
        );
      }

      [enrollment] = await Enrollment.create(
        [
          {
            studentId,
            courseId,
            classId: targetClass ? targetClass._id : null,
            sectionId: "",
            status: ENROLLMENT_STATUS.ACTIVE,
            paymentStatus: effectivePaymentStatus,
            createdBy,
          },
        ],
        { session }
      );
    });


    // Automatically remove course from student's saved wishlist once enrolled
    try {
      await SavedCourse.deleteOne({ studentId, courseId });
    } catch {
      // Non-critical cleanup
    }

    return enrollment;
  } finally {
    await session.endSession();
  }
};



const getEnrollments = async (userId, userRole, query = {}) => {
  const filter = { isDeleted: { $ne: true } };

  if (userRole === USER_ROLE.STUDENT) {
    filter.studentId = userId;
  } else if (userRole === USER_ROLE.TEACHER) {
    const teacherClassIds = await Class.find({
      teacherId: userId,
      isDeleted: { $ne: true },
    }).distinct("_id");
    filter.classId = { $in: teacherClassIds };
  } else if (userRole === USER_ROLE.ADMIN) {
    if (query.courseId) {
      filter.courseId = query.courseId;
    }
    if (query.classId) {
      filter.classId = query.classId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }
    if (query.batchStatus === "unassigned") {
      filter.$or = [{ classId: null }, { classId: { $exists: false } }];
    } else if (query.batchStatus === "assigned") {
      filter.classId = { $ne: null, $exists: true };
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      const matchedStudents = await User.find({
        $or: [{ fullName: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
      }).distinct("_id");

      filter.studentId = { $in: matchedStudents };
    }
  }

  // If page or limit provided (e.g. for admin), paginate:
  if (query.page || query.limit) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const [total, enrollments] = await Promise.all([
      Enrollment.countDocuments(filter),
      Enrollment.find(filter)
        .populate("studentId", "fullName email phone avatar")
        .populate("courseId", "title slug thumbnail shortDescription price category")
        .populate({
          path: "classId",
          select: "batchName startDate endDate teacherId sections capacity currentStudents",
          populate: {
            path: "teacherId",
            select: "fullName email avatar",
          },
        })
        .sort({ enrolledAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: enrollments,
    };
  }

  const enrollments = await Enrollment.find(filter)
    .populate("studentId", "fullName email phone avatar")
    .populate("courseId", "title slug thumbnail shortDescription price category")
    .populate({
      path: "classId",
      select: "batchName startDate endDate teacherId sections capacity currentStudents",
      populate: {
        path: "teacherId",
        select: "fullName email avatar",
      },
    })
    .sort({ enrolledAt: -1, createdAt: -1 });

  return enrollments;
};

const getEnrollmentById = async (id, userId, userRole) => {
  const enrollment = await Enrollment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email phone avatar")
    .populate("courseId", "title slug thumbnail shortDescription price category")
    .populate({
      path: "classId",
      select: "batchName startDate endDate teacherId sections capacity currentStudents",
      populate: {
        path: "teacherId",
        select: "fullName email avatar",
      },
    });

  if (!enrollment) {
    throw new ApiError(404, ENROLLMENT_MESSAGES.ENROLLMENT_NOT_FOUND);
  }

  if (userRole === USER_ROLE.STUDENT && enrollment.studentId?._id?.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this enrollment");
  }

  if (userRole === USER_ROLE.TEACHER && enrollment.classId?.teacherId?._id?.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this enrollment");
  }

  return enrollment;
};

const assignClass = async (enrollmentId, newClassId) => {
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    isDeleted: { $ne: true },
  });

  if (!enrollment) {
    throw new ApiError(404, ENROLLMENT_MESSAGES.ENROLLMENT_NOT_FOUND);
  }

  const targetClass = await Class.findOne({
    _id: newClassId,
    courseId: enrollment.courseId,
    isDeleted: { $ne: true },
  });

  if (!targetClass) {
    throw new ApiError(404, "Target class batch not found for this course.");
  }

  if (targetClass.capacity && targetClass.currentStudents >= targetClass.capacity) {
    throw new ApiError(400, "Selected class batch has reached its maximum capacity.");
  }

  const oldClassId = enrollment.classId;

  // Update old class student count if any
  if (oldClassId && oldClassId.toString() !== newClassId.toString()) {
    await Class.findByIdAndUpdate(oldClassId, { $inc: { currentStudents: -1 } });
  }

  // Increment new class student count if changing or newly assigning
  if (!oldClassId || oldClassId.toString() !== newClassId.toString()) {
    await Class.findByIdAndUpdate(newClassId, { $inc: { currentStudents: 1 } });
  }

  enrollment.classId = targetClass._id;
  await enrollment.save();

  const populated = await Enrollment.findById(enrollment._id)
    .populate("studentId", "fullName email phone avatar")
    .populate("courseId", "title slug thumbnail shortDescription price category")
    .populate({
      path: "classId",
      select: "batchName startDate endDate teacherId sections capacity currentStudents",
      populate: {
        path: "teacherId",
        select: "fullName email avatar",
      },
    });

  return populated;
};

const deleteEnrollment = async (id) => {
  const enrollment = await Enrollment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!enrollment) {
    throw new ApiError(404, ENROLLMENT_MESSAGES.ENROLLMENT_NOT_FOUND);
  }

  if (enrollment.classId) {
    await Class.findByIdAndUpdate(enrollment.classId, { $inc: { currentStudents: -1 } });
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
  assignClass,
  deleteEnrollment,
};

