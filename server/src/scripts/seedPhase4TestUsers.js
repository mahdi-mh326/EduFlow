import "../config/dns.js";
import "dotenv/config";
import mongoose from "mongoose";
import User from "../modules/user/user.model.js";
import TeacherProfile from "../modules/teacher/teacher.model.js";
import { USER_ROLE, USER_STATUS } from "../modules/user/user.constant.js";
import logger from "../shared/logger.js";

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  logger.error("Missing required environment variable: MONGODB_URI");
  process.exit(1);
}

const TEST_TEACHERS = [
  {
    email: "teacher.phase4.a@eduflow.dev",
    phone: "+8801711111001",
    password: "Phase4TeacherA@123",
    fullName: "Phase4 Teacher A",
    gender: "male",
    role: USER_ROLE.TEACHER,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    mustChangePassword: false,
    teacherProfile: {
      designation: "Test Instructor A",
      qualification: "BSc in CS",
      experienceYears: 2,
      bio: "Development-only test teacher A.",
      profileCompleted: true,
    },
  },
  {
    email: "teacher.phase4.b@eduflow.dev",
    phone: "+8801711111002",
    password: "Phase4TeacherB@123",
    fullName: "Phase4 Teacher B",
    gender: "male",
    role: USER_ROLE.TEACHER,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    mustChangePassword: false,
    teacherProfile: {
      designation: "Test Instructor B",
      qualification: "BSc in CS",
      experienceYears: 2,
      bio: "Development-only test teacher B.",
      profileCompleted: true,
    },
  },
];

const ensureTestTeacher = async (spec) => {
  const { email, phone, password, teacherProfile, ...userFields } = spec;

  let user = await User.findOne({ email }).select("+password");

  if (user) {
    user.password = password;
    user.fullName = userFields.fullName;
    user.gender = userFields.gender;
    user.role = USER_ROLE.TEACHER;
    user.status = USER_STATUS.ACTIVE;
    user.isVerified = true;
    user.mustChangePassword = false;
    await user.save();
    logger.info(`Updated test teacher: ${email}`);
  } else {
    user = await User.create({
      ...userFields,
      email,
      phone,
      password,
      role: USER_ROLE.TEACHER,
      status: USER_STATUS.ACTIVE,
      isVerified: true,
      mustChangePassword: false,
    });
    logger.info(`Created test teacher: ${email}`);
  }

  let profile = await TeacherProfile.findOne({ userId: user._id });

  if (profile) {
    profile.designation = teacherProfile.designation;
    profile.qualification = teacherProfile.qualification;
    profile.experienceYears = teacherProfile.experienceYears;
    profile.bio = teacherProfile.bio || "";
    profile.profileCompleted = true;
    await profile.save();
    logger.info(`Updated teacher profile for: ${email}`);
  } else {
    const employeeId = `TCH-PHASE4-${user._id.toString().slice(-4).toUpperCase()}`;
    profile = await TeacherProfile.create({
      userId: user._id,
      employeeId,
      ...teacherProfile,
    });
    logger.info(`Created teacher profile for: ${email} (employeeId: ${employeeId})`);
  }

  return { user, profile };
};

const seed = async () => {
  await mongoose.connect(MONGODB_URI, {
    authSource: "admin",
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });

  logger.info("✅ MongoDB Connected Successfully");

  for (const spec of TEST_TEACHERS) {
    await ensureTestTeacher(spec);
  }

  logger.info("Phase 4 test teacher seeding complete.");
};

seed()
  .catch((error) => {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
