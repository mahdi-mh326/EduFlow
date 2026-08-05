import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { USER_ROLE } from "../user/user.constant.js";
import { EnrollmentController } from "./enrollment.controller.js";
import { EnrollmentValidation } from "./enrollment.validation.js";

const router = express.Router();

router.get("/", authenticate, EnrollmentController.getEnrollments);

router.get("/:id", authenticate, EnrollmentController.getEnrollmentById);

router.post("/", authenticate, EnrollmentController.createEnrollment);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN),
  EnrollmentController.deleteEnrollment
);

export default router;
