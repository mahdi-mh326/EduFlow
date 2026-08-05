import express from "express";

import authRoutes from "../modules/auth/auth.route.js";
import userRoutes from "../modules/user/user.route.js";
import teacherRoutes from "../modules/teacher/teacher.route.js";
import adminRoutes from "../modules/admin/admin.route.js";
import courseRoutes from "../modules/course/course.route.js";
import classRoutes from "../modules/class/class.route.js";
import enrollmentRoutes from "../modules/enrollment/enrollment.route.js";
import studentRoutes from "../modules/student/student.route.js";
import materialRoutes from "../modules/material/material.route.js";
import noticeRoutes from "../modules/notice/notice.route.js";
import liveSessionRoutes from "../modules/live-session/live-session.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/teachers", teacherRoutes);
router.use("/admins", adminRoutes);
router.use("/courses", courseRoutes);
router.use("/classes", classRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/student", studentRoutes);
router.use("/materials", materialRoutes);
router.use("/notices", noticeRoutes);
router.use("/live-sessions", liveSessionRoutes);

export default router;
