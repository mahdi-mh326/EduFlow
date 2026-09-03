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

/* =======================================
   Admin Student Management Endpoints
======================================= */
router.get(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  StudentController.getAllStudents
);

router.get(
  "/stats",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  StudentController.getStudentsStats
);

router.get(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  StudentController.getStudentById
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  StudentController.updateStudentStatus
);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  StudentController.deleteStudent
);

router.post(
  "/:id/warn",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  StudentController.warnStudent
);

export default router;


