import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { QuestionService } from "./question.service.js";
import { QUESTION_MESSAGES } from "./question.constant.js";
import { QuestionValidation } from "./question.validation.js";

const createQuestion = catchAsync(async (req, res) => {
  const result = await QuestionService.createQuestion(req.params.quizId, req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: QUESTION_MESSAGES.QUESTION_CREATED,
    data: result,
  });
});

const getQuestions = catchAsync(async (req, res) => {
  const result = await QuestionService.getQuestions(req.params.quizId, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: QUESTION_MESSAGES.QUESTIONS_FETCHED,
    data: result,
  });
});

const getQuestionById = catchAsync(async (req, res) => {
  const result = await QuestionService.getQuestionById(req.params.quizId, req.params.questionId, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: QUESTION_MESSAGES.QUESTION_FETCHED,
    data: result,
  });
});

const updateQuestion = catchAsync(async (req, res) => {
  const result = await QuestionService.updateQuestion(req.params.quizId, req.params.questionId, req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: QUESTION_MESSAGES.QUESTION_UPDATED,
    data: result,
  });
});

const deleteQuestion = catchAsync(async (req, res) => {
  const result = await QuestionService.deleteQuestion(req.params.quizId, req.params.questionId, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const QuestionController = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};
