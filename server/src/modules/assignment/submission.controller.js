import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { SubmissionService } from "./submission.service.js";
import { SUBMISSION_MESSAGES } from "./submission.constant.js";
import { SubmissionValidation } from "./submission.validation.js";

const createSubmission = catchAsync(async (req, res) => {
  const result = await SubmissionService.createSubmission(req.params.id, req.body, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: SUBMISSION_MESSAGES.SUBMISSION_CREATED,
    data: result,
  });
});

const getMySubmission = catchAsync(async (req, res) => {
  const result = await SubmissionService.getMySubmission(req.params.id, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: SUBMISSION_MESSAGES.SUBMISSION_FETCHED,
    data: result,
  });
});

const updateMySubmission = catchAsync(async (req, res) => {
  const result = await SubmissionService.updateMySubmission(req.params.id, req.body, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: SUBMISSION_MESSAGES.SUBMISSION_UPDATED,
    data: result,
  });
});

const getSubmissions = catchAsync(async (req, res) => {
  const result = await SubmissionService.getSubmissions(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: SUBMISSION_MESSAGES.SUBMISSION_FETCHED,
    data: result,
  });
});

const gradeSubmission = catchAsync(async (req, res) => {
  const result = await SubmissionService.gradeSubmission(
    req.params.id,
    req.params.submissionId,
    req.body,
    req.user._id,
    req.user.role
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Submission graded successfully",
    data: result,
  });
});

export const SubmissionController = {
  createSubmission,
  getMySubmission,
  updateMySubmission,
  getSubmissions,
  gradeSubmission,
};

