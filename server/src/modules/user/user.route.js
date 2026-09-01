import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { UserController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";
import { uploadAvatar } from "../../middlewares/upload.avatar.js";

const router = express.Router();

router.get("/me", authenticate, UserController.getMe);

router.patch(
  "/me",
  authenticate,
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateProfile
);

router.patch(
  "/change-password",
  authenticate,
  validateRequest(UserValidation.changePasswordValidationSchema),
  UserController.changePassword
);

router.post(
  "/me/avatar",
  authenticate,
  uploadAvatar.single("avatar"),
  UserController.uploadAvatar
);

export default router;
