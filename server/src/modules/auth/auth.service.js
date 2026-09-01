import User from "../user/user.model.js";
import ApiError from "../../shared/ApiError.js";
import { OTPService } from "../otp/otp.service.js";
import sendEmail from "../../utils/email/sendEmail.js";
import { emailTemplates } from "../../utils/email/email.template.js";
import { tokenUtils } from "./auth.token.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { AUTH_MESSAGES } from "./auth.constant.js";

const registerUser = async (payload) => {
  const existingEmail = await User.findOne({
    email: payload.email,
  });

  if (existingEmail) {
    throw new ApiError(409, AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  const existingPhone = await User.findOne({
    phone: payload.phone,
  });

  if (existingPhone) {
    throw new ApiError(409, AUTH_MESSAGES.PHONE_ALREADY_EXISTS);
  }

  const user = await User.create(payload);

  const otp = await OTPService.sendOTP(payload.email);

  await sendEmail({
    to: payload.email,
    subject: "Verify Your Email",
    html: emailTemplates.otpVerification(payload.fullName, otp),
  });

  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    message: AUTH_MESSAGES.REGISTRATION_SUCCESS,
  };
};

const verifyEmail = async (email, otp) => {
  await OTPService.verifyOTP(email, otp);

  const user = await User.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      status: USER_STATUS.ACTIVE,
    },
    { new: true }
  ).select("+mustChangePassword");

  if (!user) {
    throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  try {
    await sendEmail({
      to: user.email,
      subject: "Welcome to EduFlow",
      html: emailTemplates.welcomeEmail(user.fullName),
    });
  } catch (err) {
    // ignore
  }

  const accessToken = tokenUtils.generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = tokenUtils.generateRefreshToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isVerified: user.isVerified,
    isMasterAdmin: user.isMasterAdmin || false,
    mustChangePassword: user.mustChangePassword,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      isMasterAdmin: user.isMasterAdmin || false,
      mustChangePassword: user.mustChangePassword,
      avatar: user.avatar,
    },
    message: AUTH_MESSAGES.EMAIL_VERIFICATION_SUCCESS,
  };
};



const resendOTP = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  if (user.isVerified) {
    throw new ApiError(400, AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED);
  }

  const otp = await OTPService.sendOTP(email);

  await sendEmail({
    to: email,
    subject: "Verify Your Email",
    html: emailTemplates.otpVerification(user.fullName, otp),
  });

  return {
    email,
    message: AUTH_MESSAGES.OTP_SENT_SUCCESS,
  };
};

const sendVerificationOTP = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  if (user.isVerified) {
    throw new ApiError(400, AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED);
  }

  const otp = await OTPService.sendOTP(email);

  await sendEmail({
    to: email,
    subject: "Verify Your Email",
    html: emailTemplates.otpVerification(user.fullName, otp),
  });

  return {
    email,
    message: AUTH_MESSAGES.OTP_SENT,
  };
};

const login = async (email, password, expectedRole) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+password +mustChangePassword");

  if (!user) {
    throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  if (expectedRole) {
    const normalizedExpectedRole = expectedRole.toLowerCase().trim();
    if (user.role !== normalizedExpectedRole) {
      const actualRoleDisplayName =
        user.role === USER_ROLE.STUDENT
          ? "Student"
          : user.role === USER_ROLE.TEACHER
          ? "Teacher"
          : "Admin";
      throw new ApiError(
        403,
        `Access denied. This account is registered as a ${actualRoleDisplayName}. Please switch to the ${actualRoleDisplayName} tab to log in.`
      );
    }
  }


  if ((user.role === USER_ROLE.TEACHER || user.role === USER_ROLE.ADMIN) && !user.isVerified) {
    const otp = await OTPService.sendOTP(user.email);
    try {
      await sendEmail({
        to: user.email,
        subject: `Verify Your Email - ${user.role === USER_ROLE.ADMIN ? 'Admin' : 'Teacher'} Portal`,
        html: emailTemplates.otpVerification(user.fullName, otp),
      });
    } catch (e) {
      // ignore
    }
    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isMasterAdmin: user.isMasterAdmin || false,
      },
      requireEmailVerification: true,
    };
  }

  if (!user.isVerified) {
    throw new ApiError(403, AUTH_MESSAGES.EMAIL_NOT_VERIFIED);
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, AUTH_MESSAGES.ACCOUNT_NOT_ACTIVE);
  }

  const accessToken = tokenUtils.generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = tokenUtils.generateRefreshToken({
    id: user._id,
  });

  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isMasterAdmin: user.isMasterAdmin || false,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
    forcePasswordChange: user.mustChangePassword || false,
  };
};


const setPassword = async (userId, payload) => {
  const { currentPassword, newPassword } = payload;

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, AUTH_MESSAGES.CURRENT_PASSWORD_INVALID);
  }

  user.password = newPassword;
  user.mustChangePassword = false;

  await user.save();

  return {
    message: AUTH_MESSAGES.SET_PASSWORD_SUCCESS,
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  const otp = await OTPService.sendOTP(email);

  await sendEmail({
    to: email,
    subject: "Reset Your EduFlow Password",
    html: emailTemplates.forgotPasswordOtp(user.fullName, otp),
  });

  return {
    email,
    message: AUTH_MESSAGES.FORGOT_PASSWORD_OTP_SENT,
  };
};

const resetPassword = async (payload) => {
  const { email, otp, newPassword } = payload;

  await OTPService.verifyOTP(email, otp);

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  if (!user.isVerified) {
    user.isVerified = true;
    user.status = USER_STATUS.ACTIVE;
  }

  await user.save();

  return {
    message: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS,
  };
};

const refreshAccessToken = async (refreshToken) => {
  const decoded = tokenUtils.verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, AUTH_MESSAGES.ACCOUNT_NOT_ACTIVE);
  }

  const accessToken = tokenUtils.generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken,
  };
};

export const AuthService = {
  registerUser,
  verifyEmail,
  resendOTP,
  sendVerificationOTP,
  login,
  setPassword,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
};

