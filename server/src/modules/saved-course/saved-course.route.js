import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { USER_ROLE } from "../user/user.constant.js";
import { SavedCourseController } from "./saved-course.controller.js";

const router = express.Router();

router.use(authenticate, authorize(USER_ROLE.STUDENT));

router.post("/toggle", SavedCourseController.toggleSaveCourse);
router.get("/", SavedCourseController.getSavedCourses);
router.get("/:courseId/check", SavedCourseController.checkCourseSaved);

export default router;
