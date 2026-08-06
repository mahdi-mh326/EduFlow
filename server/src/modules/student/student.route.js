import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { USER_ROLE } from "../user/user.constant.js";
import { StudentController } from "./student.controller.js";
import { LiveSessionController } from "../live-session/live-session.controller.js";
import { AttendanceController } from "../attendance/attendance.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  StudentController.getStudentDashboard
);

router.get(
  "/live-sessions",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  LiveSessionController.getStudentLiveSessions
);

router.get(
  "/attendance",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  AttendanceController.getStudentAttendance
);

export default router;
