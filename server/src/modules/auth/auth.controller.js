import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { AuthService } from "./auth.service.js";
import { AUTH_MESSAGES, AUTH_STATUS_CODES } from "./auth.constant.js";

const register = catchAsync(async (req, res) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.CREATED,
    success: true,
    message: AUTH_MESSAGES.REGISTRATION_SUCCESS,
    data: result,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await AuthService.verifyEmail(email, otp);

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.EMAIL_VERIFICATION_SUCCESS,
    data: result,
  });
});

const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.resendOTP(email);

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.OTP_SENT_SUCCESS,
    data: result,
  });
});

const sendVerificationOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.sendVerificationOTP(email);

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.OTP_SENT,
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;
  const result = await AuthService.login(email, password, role);


  if (result.requireEmailVerification) {
    return sendResponse(res, {
      statusCode: AUTH_STATUS_CODES.SUCCESS,
      success: true,
      message: "Email verification required. An OTP has been sent to your email.",
      data: {
        user: result.user,
        requireEmailVerification: true,
      },
    });
  }

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  const responseData = {
    user: result.user,
    accessToken: result.accessToken,
  };

  if (result.forcePasswordChange) {
    responseData.forcePasswordChange = true;
  }

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
    data: responseData,
  });
});


const setPassword = catchAsync(async (req, res) => {
  const result = await AuthService.setPassword(req.user._id, req.body);

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.SET_PASSWORD_SUCCESS,
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return sendResponse(res, {
      statusCode: AUTH_STATUS_CODES.UNAUTHORIZED,
      success: false,
      message: AUTH_MESSAGES.REFRESH_TOKEN_NOT_FOUND,
      data: null,
    });
  }

  const result = await AuthService.refreshAccessToken(token);

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.TOKEN_REFRESHED,
    data: result,
  });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie("refreshToken");

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    data: null,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.FORGOT_PASSWORD_OTP_SENT,
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: AUTH_STATUS_CODES.SUCCESS,
    success: true,
    message: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS,
    data: result,
  });
});

export const AuthController = {
  register,
  verifyEmail,
  resendOTP,
  sendVerificationOTP,
  login,
  setPassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
};

