import { generateTemporaryPassword } from "../../shared/password.utils.js";
import { checkDuplicateEmail, checkDuplicatePhone } from "../../shared/userValidation.utils.js";
import { createStaffUser } from "../../shared/userCreation.utils.js";
import { EMAIL_SUBJECTS } from "../../constants/email.constant.js";
import sendEmail from "../../utils/email/sendEmail.js";
import { emailTemplates } from "../../utils/email/email.template.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import User from "../user/user.model.js";
import ApiError from "../../shared/ApiError.js";
import logger from "../../shared/logger.js";

const createAdmin = async (payload, createdBy) => {
  await Promise.all([
    checkDuplicateEmail(payload.email),
    checkDuplicatePhone(payload.phone),
  ]);

  let temporaryPassword = generateTemporaryPassword();

  const user = await createStaffUser(payload, temporaryPassword, {
    role: USER_ROLE.ADMIN,
    status: USER_STATUS.PENDING,
    isVerified: false,
    mustChangePassword: true,
    isMasterAdmin: false,
    createdBy,
  });


  try {
    await sendEmail({
      to: user.email,
      subject: EMAIL_SUBJECTS.WELCOME_ADMIN || "Welcome to EduFlow - Admin Account Created",
      html: emailTemplates.adminWelcome(user.fullName, user.email, temporaryPassword),
    });
  } catch (emailError) {
    logger.error(`Welcome email failed for admin [${user.email}]: ${emailError.message}`);
  } finally {
    temporaryPassword = null;
  }

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    isMasterAdmin: user.isMasterAdmin,
  };
};

const getAdmins = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {
    role: USER_ROLE.ADMIN,
    isDeleted: { $ne: true },
  };

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [admins, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-password -refreshToken")
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    admins,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

const updateAdminStatus = async (adminId, status) => {
  if (![USER_STATUS.ACTIVE, USER_STATUS.BLOCKED].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'active' or 'blocked'.");
  }

  const admin = await User.findOne({ _id: adminId, role: USER_ROLE.ADMIN, isDeleted: { $ne: true } });
  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  if (admin.isMasterAdmin) {
    throw new ApiError(403, "Master Admin status cannot be altered.");
  }

  admin.status = status;
  await admin.save();

  return {
    id: admin._id,
    fullName: admin.fullName,
    email: admin.email,
    status: admin.status,
    isMasterAdmin: admin.isMasterAdmin,
  };
};

const deleteAdmin = async (adminId) => {
  const admin = await User.findOne({ _id: adminId, role: USER_ROLE.ADMIN });
  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  if (admin.isMasterAdmin) {
    throw new ApiError(403, "Master Admin cannot be deleted.");
  }

  await User.deleteOne({ _id: adminId });

  return {
    id: adminId,
    message: "Admin deleted successfully.",
  };
};


export const AdminService = { createAdmin, getAdmins, updateAdminStatus, deleteAdmin };

