import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { QuizService } from "./quiz.service.js";
import { QUIZ_MESSAGES } from "./quiz.constant.js";
import { QuizValidation } from "./quiz.validation.js";
import Quiz from "./quiz.model.js";
import { QUIZ_STATUS } from "./quiz.constant.js";
import { NotificationService } from "../notification/notification.service.js";

const createQuiz = catchAsync(async (req, res) => {
  const result = await QuizService.createQuiz(req.body, req.user._id, req.user.role);
  await NotificationService.dispatchQuizCreated(result, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: QUIZ_MESSAGES.QUIZ_CREATED,
    data: result,
  });
});

const getQuizzes = catchAsync(async (req, res) => {
  const result = await QuizService.getQuizzes(req.user._id, req.user.role, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: QUIZ_MESSAGES.QUIZZES_FETCHED,
    meta: result.meta,
    data: result.quizzes,
  });
});

const getQuizById = catchAsync(async (req, res) => {
  const result = await QuizService.getQuizById(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: QUIZ_MESSAGES.QUIZ_FETCHED,
    data: result,
  });
});

const updateQuiz = catchAsync(async (req, res) => {
  const oldQuiz = await Quiz.findById(req.params.id).select("status title description instructions durationMinutes totalMarks passingMarks startDate endDate attemptLimit");
  const result = await QuizService.updateQuiz(req.params.id, req.body, req.user._id, req.user.role);

  if (result.status === QUIZ_STATUS.PUBLISHED) {
    const fieldsToCheck = ["title", "description", "instructions", "durationMinutes", "totalMarks", "passingMarks", "startDate", "endDate", "attemptLimit"];
    const changed = fieldsToCheck.some((field) => {
      const oldVal = oldQuiz ? oldQuiz[field] : undefined;
      const newVal = result[field];
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    });

    if (changed) {
      await NotificationService.dispatchQuizUpdated(result, req.user._id);
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: QUIZ_MESSAGES.QUIZ_UPDATED,
    data: result,
  });
});

const deleteQuiz = catchAsync(async (req, res) => {
  const result = await QuizService.deleteQuiz(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const QuizController = {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
};
