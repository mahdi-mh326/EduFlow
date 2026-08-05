import { generateTemporaryPassword } from "../../shared/password.utils.js";
import { checkDuplicateEmail, checkDuplicatePhone } from "../../shared/userValidation.utils.js";
import { createStaffUser } from "../../shared/userCreation.utils.js";
import { EMAIL_SUBJECTS } from "../../constants/email.constant.js";
import sendEmail from "../../utils/email/sendEmail.js";
import { emailTemplates } from "../../utils/email/email.template.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import logger from "../../shared/logger.js";

const createAdmin = async (payload, createdBy) => {
  await Promise.all([
    checkDuplicateEmail(payload.email),
    checkDuplicatePhone(payload.phone),
  ]);

  let temporaryPassword = generateTemporaryPassword();

  const user = await createStaffUser(payload, temporaryPassword, {
    role: USER_ROLE.ADMIN,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    createdBy,
  });

  try {
    await sendEmail({
      to: user.email,
      subject: EMAIL_SUBJECTS.WELCOME_ADMIN,
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
  };
};

export const AdminService = { createAdmin };
