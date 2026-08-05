import "../config/dns.js";
import "dotenv/config";
import mongoose from "mongoose";
import User from "../modules/user/user.model.js";
import { USER_ROLE, USER_STATUS } from "../modules/user/user.constant.js";
import logger from "../shared/logger.js";

/* =========================
   Validate Environment
========================= */

const {
  MONGODB_URI,
  SUPER_ADMIN_NAME,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PHONE,
  SUPER_ADMIN_PASSWORD,
} = process.env;

const missing = [
  ["MONGODB_URI",          MONGODB_URI],
  ["SUPER_ADMIN_NAME",     SUPER_ADMIN_NAME],
  ["SUPER_ADMIN_EMAIL",    SUPER_ADMIN_EMAIL],
  ["SUPER_ADMIN_PHONE",    SUPER_ADMIN_PHONE],
  ["SUPER_ADMIN_PASSWORD", SUPER_ADMIN_PASSWORD],
]
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

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

  const exists = await User.findOne(
    { role: USER_ROLE.SUPER_ADMIN },
    { _id: 1 }
  ).lean();

  if (exists) {
    logger.info("Super Admin already exists.");
    return;
  }

  await User.create({
    fullName: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_EMAIL,
    phone: SUPER_ADMIN_PHONE,
    password: SUPER_ADMIN_PASSWORD,
    role: USER_ROLE.SUPER_ADMIN,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    createdBy: null,
  });

  logger.info("Super Admin created successfully.");
};

seed()
  .catch((error) => {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
