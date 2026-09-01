import "../config/dns.js";
import "dotenv/config";
import mongoose from "mongoose";
import User from "../modules/user/user.model.js";
import { USER_ROLE, USER_STATUS } from "../modules/user/user.constant.js";
import logger from "../shared/logger.js";

const {
  MONGODB_URI,
  ADMIN_NAME,
  ADMIN_EMAIL,
  ADMIN_PHONE,
  ADMIN_PASSWORD,
  SUPER_ADMIN_NAME,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PHONE,
  SUPER_ADMIN_PASSWORD,
} = process.env;

const masterName = ADMIN_NAME || SUPER_ADMIN_NAME || "Master Admin";
const masterEmail = ADMIN_EMAIL || SUPER_ADMIN_EMAIL;
const masterPhone = ADMIN_PHONE || SUPER_ADMIN_PHONE || "+8801700000000";
const masterPassword = ADMIN_PASSWORD || SUPER_ADMIN_PASSWORD;

if (!MONGODB_URI) {
  logger.error("Missing MONGODB_URI in environment variables.");
  process.exit(1);
}

if (!masterEmail || !masterPassword) {
  logger.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables.");
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

  const targetEmail = masterEmail.toLowerCase().trim();

  // Remove any previous master admin if email has changed
  const previousMasterAdmins = await User.find({
    role: USER_ROLE.ADMIN,
    isMasterAdmin: true,
    email: { $ne: targetEmail },
  });

  if (previousMasterAdmins.length > 0) {
    await User.deleteMany({
      role: USER_ROLE.ADMIN,
      isMasterAdmin: true,
      email: { $ne: targetEmail },
    });
    logger.info(`🗑️ Removed ${previousMasterAdmins.length} previous Master Admin account(s).`);
  }

  const existingAdmin = await User.findOne({
    role: USER_ROLE.ADMIN,
    email: targetEmail,
  });

  if (existingAdmin) {
    existingAdmin.fullName = masterName;
    existingAdmin.phone = masterPhone;
    existingAdmin.password = masterPassword;
    existingAdmin.isMasterAdmin = true;
    existingAdmin.isVerified = true;
    existingAdmin.status = USER_STATUS.ACTIVE;
    existingAdmin.mustChangePassword = false;
    await existingAdmin.save();
    logger.info(`🎉 Master Admin [${targetEmail}] updated successfully with new credentials from .env.`);
    return;
  }

  await User.create({
    fullName: masterName,
    email: targetEmail,
    phone: masterPhone,
    password: masterPassword,
    role: USER_ROLE.ADMIN,
    isMasterAdmin: true,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    mustChangePassword: false,
    createdBy: null,
  });

  logger.info(`🎉 New Master Admin [${targetEmail}] created successfully.`);
};


seed()
  .catch((error) => {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
