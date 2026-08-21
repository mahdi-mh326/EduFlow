import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { AttemptService } from "./attempt.service.js";
import { ATTEMPT_MESSAGES } from "./attempt.constant.js";
import { AttemptValidation } from "./attempt.validation.js";

const startAttempt = catchAsync(async (req, res) => {
  const { attempt, isNew } = await AttemptService.startAttempt(req.params.id, req.user._id);

  sendResponse(res, {
    statusCode: isNew ? 201 : 200,
    success: true,
    message: isNew ? ATTEMPT_MESSAGES.ATTEMPT_STARTED : "Attempt already in progress",
    data: attempt,
  });
});

const getCurrentAttempt = catchAsync(async (req, res) => {
  const result = await AttemptService.getCurrentAttempt(req.params.id, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTEMPT_MESSAGES.ATTEMPT_FETCHED,
    data: result,
  });
});

const getMyAttempts = catchAsync(async (req, res) => {
  const result = await AttemptService.getMyAttempts(req.params.id, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTEMPT_MESSAGES.ATTEMPT_FETCHED,
    data: result,
  });
});

const submitAttempt = catchAsync(async (req, res) => {
  const result = await AttemptService.submitAttempt(req.params.id, req.params.attemptId, req.body, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTEMPT_MESSAGES.ATTEMPT_SUBMITTED,
    data: result,
  });
});

const getAttempts = catchAsync(async (req, res) => {
  const result = await AttemptService.getAttempts(req.params.quizId, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTEMPT_MESSAGES.ATTEMPT_FETCHED,
    data: result,
  });
});

export const AttemptController = {
  startAttempt,
  getCurrentAttempt,
  getMyAttempts,
  submitAttempt,
  getAttempts,
};
