import "../config/dns.js";
import "dotenv/config";
import mongoose from "mongoose";
import User from "../modules/user/user.model.js";
import Course from "../modules/course/course.model.js";
import Class from "../modules/class/class.model.js";
import Enrollment from "../modules/enrollment/enrollment.model.js";
import { USER_ROLE, USER_STATUS } from "../modules/user/user.constant.js";
import { PAYMENT_STATUS, ENROLLMENT_STATUS } from "../modules/enrollment/enrollment.constant.js";
import { CLASS_STATUS } from "../modules/class/class.constant.js";
import logger from "../shared/logger.js";

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  logger.error("Missing required environment variable: MONGODB_URI");
  process.exit(1);
}

const seed = async () => {
  await mongoose.connect(MONGODB_URI, {
    authSource: "admin",
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });

  logger.info("✅ MongoDB Connected Successfully");

  // Use the already-created Teacher B course
  const course = await Course.findOne({ slug: "phase4-teacher-b-course" }).lean();
  if (!course) {
    logger.error("Teacher B course not found. Run this after the course is created.");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Find or create Teacher B's class
  let cls = await Class.findOne({ courseId: course._id, teacherId: "6a841f9c16e274c766bfe1eb" }).lean();
  if (!cls) {
    cls = await Class.create({
      courseId: course._id,
      teacherId: "6a841f9c16e274c766bfe1eb",
      batchName: "Phase4 Teacher B Class",
      startDate: new Date("2026-12-01"),
      endDate: new Date("2026-12-31"),
      classDays: ["Saturday", "Sunday"],
      startTime: "10:00",
      endTime: "12:00",
      status: CLASS_STATUS.UPCOMING,
      createdBy: "6a841f9c16e274c766bfe1eb",
      sections: [
        { name: "A", capacity: 20, currentStudents: 0, status: "active" },
        { name: "B", capacity: 20, currentStudents: 0, status: "active" },
      ],
    });
    logger.info(`Created class for Teacher B: ${cls._id}`);
  } else {
    logger.info(`Found existing Teacher B class: ${cls._id}`);
  }

  // Students to enroll
  const student2 = await User.findOne({ email: "student.seed.2@eduflow.dev" }).lean();
  const student1 = await User.findOne({ email: "student.seed.1@eduflow.dev" }).lean();

  if (!student2 || !student1) {
    logger.error("Required students not found.");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Enroll student2 (pending payment)
  const existing2 = await Enrollment.findOne({ studentId: student2._id, courseId: course._id, isDeleted: { $ne: true } }).lean();
  if (!existing2) {
    await Enrollment.create({
      studentId: student2._id,
      courseId: course._id,
      classId: cls._id,
      sectionId: "A",
      paymentStatus: PAYMENT_STATUS.PENDING,
      status: ENROLLMENT_STATUS.ACTIVE,
      createdBy: student2._id,
    });
    logger.info(`Enrolled student2 (pending) in Teacher B class`);
  } else {
    logger.info(`Student2 already enrolled: ${existing2._id}`);
  }

  // Enroll student1 (paid payment)
  const existing1 = await Enrollment.findOne({ studentId: student1._id, courseId: course._id, isDeleted: { $ne: true } }).lean();
  if (!existing1) {
    await Enrollment.create({
      studentId: student1._id,
      courseId: course._id,
      classId: cls._id,
      sectionId: "A",
      paymentStatus: PAYMENT_STATUS.PAID,
      transactionId: "DEV-PHASE4-PAID",
      status: ENROLLMENT_STATUS.ACTIVE,
      createdBy: student1._id,
    });
    logger.info(`Enrolled student1 (paid) in Teacher B class`);
  } else {
    // Update to paid if not already
    if (existing1.paymentStatus !== PAYMENT_STATUS.PAID) {
      await Enrollment.findByIdAndUpdate(existing1._id, { paymentStatus: PAYMENT_STATUS.PAID, transactionId: "DEV-PHASE4-PAID" });
      logger.info(`Updated student1 enrollment to paid: ${existing1._id}`);
    } else {
      logger.info(`Student1 already enrolled (paid): ${existing1._id}`);
    }
  }

  // Verify
  const enrollments = await Enrollment.find({ courseId: course._id, classId: cls._id, isDeleted: { $ne: true } })
    .populate("studentId", "fullName email")
    .lean();

  logger.info("Teacher B class enrollments:");
  for (const e of enrollments) {
    logger.info(`  - ${e.studentId.fullName} | paymentStatus: ${e.paymentStatus}`);
  }

  logger.info("Seeding complete.");
};

seed()
  .catch((error) => {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
