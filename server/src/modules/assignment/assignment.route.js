import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { AssignmentController } from "./assignment.controller.js";
import { SubmissionController } from "./submission.controller.js";
import { AssignmentValidation } from "./assignment.validation.js";
import { SubmissionValidation } from "./submission.validation.js";

const router = express.Router();

router.get("/", authenticate, AssignmentController.getAssignments);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(AssignmentValidation.createAssignmentSchema),
  AssignmentController.createAssignment
);

router.get("/:id", authenticate, AssignmentController.getAssignmentById);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(AssignmentValidation.updateAssignmentSchema),
  AssignmentController.updateAssignment
);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  AssignmentController.deleteAssignment
);

router.post(
  "/:id/submissions",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  validateRequest(SubmissionValidation.createSubmissionSchema),
  SubmissionController.createSubmission
);

router.get(
  "/:id/submissions/me",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  SubmissionController.getMySubmission
);

router.patch(
  "/:id/submissions/me",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  validateRequest(SubmissionValidation.updateSubmissionSchema),
  SubmissionController.updateMySubmission
);

router.get(
  "/:id/submissions",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  SubmissionController.getSubmissions
);

router.patch(
  "/:id/submissions/:submissionId/grade",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(SubmissionValidation.gradeSubmissionSchema),
  SubmissionController.gradeSubmission
);

export default router;

