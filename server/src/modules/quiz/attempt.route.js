import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { AttemptController } from "./attempt.controller.js";
import { AttemptValidation } from "./attempt.validation.js";

const router = express.Router();

router.post(
  "/:id/attempts",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  validateRequest(AttemptValidation.startAttemptSchema),
  AttemptController.startAttempt
);

router.get(
  "/:id/attempts/current",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  AttemptController.getCurrentAttempt
);

router.get(
  "/:id/attempts/me",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  AttemptController.getMyAttempts
);

router.post(
  "/:id/attempts/:attemptId/submit",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  validateRequest(AttemptValidation.submitAttemptSchema),
  AttemptController.submitAttempt
);

router.get(
  "/:quizId/attempts",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  AttemptController.getAttempts
);

export default router;
