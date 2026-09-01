import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { QuestionController } from "./question.controller.js";
import { QuestionValidation } from "./question.validation.js";

const router = express.Router();

router.get("/", authenticate, QuestionController.getQuestions);

router.get("/:questionId", authenticate, QuestionController.getQuestionById);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(QuestionValidation.createQuestionSchema),
  QuestionController.createQuestion
);

router.patch(
  "/:questionId",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  validateRequest(QuestionValidation.updateQuestionSchema),
  QuestionController.updateQuestion
);

router.delete(
  "/:questionId",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  QuestionController.deleteQuestion
);

export default router;
