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

export const StudentService = {
  getStudentDashboard,
};
