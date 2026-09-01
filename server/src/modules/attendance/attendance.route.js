import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { AttendanceController } from "./attendance.controller.js";
import { AttendanceValidation } from "./attendance.validation.js";

const router = express.Router();

router.post(
  "/start",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(AttendanceValidation.startAttendanceSchema),
  AttendanceController.startAttendance
);

router.post(
  "/submit",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(AttendanceValidation.submitAttendanceSchema),
  AttendanceController.submitAttendance
);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(AttendanceValidation.updateAttendanceSchema),
  AttendanceController.updateAttendance
);

router.post(
  "/class/:classId/submit",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  AttendanceController.submitClassAttendance
);

router.get(
  "/class/:classId/records",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  AttendanceController.getClassAttendanceHistory
);


router.use(authenticate, authorize(USER_ROLE.ADMIN));

router.get("/", AttendanceController.getAttendances);

router.get("/report", AttendanceController.getAttendanceReport);

export default router;
