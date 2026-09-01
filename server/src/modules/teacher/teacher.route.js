import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { TeacherValidation } from "./teacher.validation.js";
import { TeacherController } from "./teacher.controller.js";
import { USER_ROLE } from "../user/user.constant.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  TeacherController.getTeachers
);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  validateRequest(TeacherValidation.createTeacherSchema),
  TeacherController.createTeacher
);

router.get(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  TeacherController.getTeacher
);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  validateRequest(TeacherValidation.updateTeacherSchema),
  TeacherController.updateTeacher
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  validateRequest(TeacherValidation.updateTeacherStatusSchema),
  TeacherController.updateTeacherStatus
);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  TeacherController.deleteTeacher
);

export default router;
