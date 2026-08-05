import express from "express";

import authenticate from "../../middlewares/authenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";

import { AuthValidation } from "./auth.validation.js";
import { AuthController } from "./auth.controller.js";

const router = express.Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register
);

router.post(
  "/verify-email",
  validateRequest(AuthValidation.verifyEmailValidationSchema),
  AuthController.verifyEmail
);

router.post(
  "/resend-otp",
  validateRequest(AuthValidation.resendOTPValidationSchema),
  AuthController.resendOTP
);

router.post(
  "/send-verification-otp",
  validateRequest(AuthValidation.sendVerificationOTPValidationSchema),
  AuthController.sendVerificationOTP
);

router.post(
  "/login",
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
