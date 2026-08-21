import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import optionalAuthenticate from "../../middlewares/optionalAuthenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { CourseValidation } from "./course.validation.js";
import { CourseController } from "./course.controller.js";

const router = express.Router();

router.get("/", optionalAuthenticate, CourseController.getAllCourses);
router.get("/:slug", optionalAuthenticate, CourseController.getCourseBySlug);

router.use(authenticate, authorize(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN));

router.post(
  "/",
  validateRequest(CourseValidation.createCourseSchema),
  CourseController.createCourse
);

router.patch(
  "/:id",
  validateRequest(CourseValidation.updateCourseSchema),
  CourseController.updateCourse
);

router.patch("/:id/publish", CourseController.publishCourse);
router.patch("/:id/feature", CourseController.featureCourse);
router.delete("/:id", CourseController.softDeleteCourse);

export default router;
