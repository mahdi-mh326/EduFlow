/**
 * Development-only seeder for Enrollment module testing.
 *
 * This script:
 *  1. Finds an existing published course with an active class.
 *  2. Creates verified active Student accounts.
 *  3. Enrolls students using the real enrollment service so that
 *     Section A is filled to capacity first.
 *  4. Enrolls one additional student, which must be assigned to Section B.
 *
 * Usage:
 *   node server/src/scripts/seedEnrollments.js
 *
 * NOTE: This script is for development only. Do not run in production.
 */

import "../config/dns.js";
import "dotenv/config";
import mongoose from "mongoose";
import User from "../modules/user/user.model.js";
import Course from "../modules/course/course.model.js";
import Class from "../modules/class/class.model.js";
import { EnrollmentService } from "../modules/enrollment/enrollment.service.js";
import { USER_ROLE, USER_STATUS } from "../modules/user/user.constant.js";
import { COURSE_STATUS } from "../modules/course/course.constant.js";
import { CLASS_STATUS } from "../modules/class/class.constant.js";
import logger from "../shared/logger.js";

/* =========================
   Validate Environment
   ========================= */

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  logger.error("Missing required environment variable: MONGODB_URI");
  process.exit(1);
}

/* =========================
   Helpers
   ========================= */

const generateEmail = (index) => `student.seed.${index}@eduflow.dev`;
const generatePhone = (index) => `+880171111${String(index).padStart(4, "0")}`;
const generatePassword = () => "TempPass123!";

const createStudent = async (index) => {
  const email = generateEmail(index);
  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) {
    return existing._id;
  }

  const student = await User.create({
    fullName: `Seed Student ${index}`,
    email,
    phone: generatePhone(index),
    password: generatePassword(),
    role: USER_ROLE.STUDENT,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    mustChangePassword: false,
    createdBy: null,
  });

  return student._id;
};

/* =========================
   Seed
   ========================= */

const seed = async () => {
  await mongoose.connect(MONGODB_URI, {
    authSource: "admin",
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });

  logger.info("✅ MongoDB Connected Successfully");

  const course = await Course.findOne({
    status: COURSE_STATUS.PUBLISHED,
    isDeleted: { $ne: true },
  }).lean();

  if (!course) {
    logger.error("No published course found. Please create a published course before running this seeder.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const cls = await Class.findOne({
    courseId: course._id,
    status: { $in: [CLASS_STATUS.UPCOMING, CLASS_STATUS.ONGOING] },
    isDeleted: { $ne: true },
  }).lean();

  if (!cls) {
    logger.error(`No active class found for course "${course.title}". Please create a class before running this seeder.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  logger.info(`Using course: ${course.title} (${course._id})`);
  logger.info(`Using class: ${cls.batchName} (${cls._id})`);

  const sectionA = cls.sections?.find((s) => s.name === "A");
  if (!sectionA) {
    logger.error("Selected class does not have Section A.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const existingEnrollments = await mongoose.model("Enrollment").countDocuments({
    classId: cls._id,
    status: "active",
    isDeleted: { $ne: true },
  });

  const slotsToFill = Math.max(0, sectionA.capacity - existingEnrollments);
  const totalStudentsToCreate = slotsToFill + 1;

  logger.info(`Existing enrollments in class: ${existingEnrollments}`);
  logger.info(`Section A capacity: ${sectionA.capacity}`);
  logger.info(`Students to create and enroll: ${totalStudentsToCreate}`);

  const createdStudentIds = [];
  for (let i = 0; i < totalStudentsToCreate; i++) {
    const studentId = await createStudent(i + 1);
    createdStudentIds.push(studentId);
  }

  logger.info(`Created ${createdStudentIds.length} student accounts.`);

  const enrollmentResults = [];
  for (const studentId of createdStudentIds) {
    try {
      const result = await EnrollmentService.createEnrollment(
        { courseId: course._id, studentId },
        studentId
      );
      enrollmentResults.push(result);
    } catch (error) {
      logger.error(`Failed to enroll student ${studentId}: ${error.message}`);
    }
  }

  logger.info(`Successfully enrolled ${enrollmentResults.length} students.`);

  const finalClass = await Class.findById(cls._id).lean();
  const finalSectionA = finalClass?.sections?.find((s) => s.name === "A");
  const finalSectionB = finalClass?.sections?.find((s) => s.name === "B");

  logger.info(`Final Section A currentStudents: ${finalSectionA?.currentStudents ?? "N/A"}`);
  logger.info(`Final Section B currentStudents: ${finalSectionB?.currentStudents ?? "N/A"}`);

  if (finalSectionA && finalSectionA.currentStudents >= sectionA.capacity) {
    logger.info("✅ Section A is now full.");
  }

  if (finalSectionB && finalSectionB.currentStudents > 0) {
    logger.info("✅ Section B has students enrolled.");
  }

  logger.info("Seeding complete.");
};

seed()
  .catch((error) => {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
