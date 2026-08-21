import express from "express";

import authenticate from "../../middlewares/authenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { authLimiter, registerLimiter } from "../../middlewares/rateLimiter.js";

import { AuthValidation } from "./auth.validation.js";
import { AuthController } from "./auth.controller.js";

const router = express.Router();

router.post(
  "/register",
  registerLimiter,
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register
);

router.post(
  "/verify-email",
  authLimiter,
  validateRequest(AuthValidation.verifyEmailValidationSchema),
  AuthController.verifyEmail
);

router.post(
  "/resend-otp",
  authLimiter,
  validateRequest(AuthValidation.resendOTPValidationSchema),
  AuthController.resendOTP
);

router.post(
  "/send-verification-otp",
  authLimiter,
  validateRequest(AuthValidation.sendVerificationOTPValidationSchema),
  AuthController.sendVerificationOTP
);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

router.post(
  "/set-password",
  authenticate,
  validateRequest(AuthValidation.setPasswordValidationSchema),
  AuthController.setPassword
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

export default router;
