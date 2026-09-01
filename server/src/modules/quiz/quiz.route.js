import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { QuizController } from "./quiz.controller.js";
import { QuestionController } from "./question.controller.js";
import { QuestionValidation } from "./question.validation.js";
import { AttemptController } from "./attempt.controller.js";
import { AttemptValidation } from "./attempt.validation.js";

const router = express.Router();

router.get("/", authenticate, QuizController.getQuizzes);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  QuizController.createQuiz
);

router.get("/:id", authenticate, QuizController.getQuizById);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  QuizController.updateQuiz
);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  QuizController.deleteQuiz
);

router.get("/:quizId/questions", authenticate, QuestionController.getQuestions);

router.post(
  "/:quizId/questions",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(QuestionValidation.createQuestionSchema),
  QuestionController.createQuestion
);

router.get("/:quizId/questions/:questionId", authenticate, QuestionController.getQuestionById);

router.patch(
  "/:quizId/questions/:questionId",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(QuestionValidation.updateQuestionSchema),
  QuestionController.updateQuestion
);

router.delete(
  "/:quizId/questions/:questionId",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  QuestionController.deleteQuestion
);

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
