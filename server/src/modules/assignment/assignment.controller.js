import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { AssignmentService } from "./assignment.service.js";
import { ASSIGNMENT_MESSAGES } from "./assignment.constant.js";
import { AssignmentValidation } from "./assignment.validation.js";
import Assignment from "./assignment.model.js";
import { ASSIGNMENT_STATUS } from "./assignment.constant.js";
import { NotificationService } from "../notification/notification.service.js";

const createAssignment = catchAsync(async (req, res) => {
  const result = await AssignmentService.createAssignment(req.body, req.user._id, req.user.role);
  await NotificationService.dispatchAssignmentCreated(result, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: ASSIGNMENT_MESSAGES.ASSIGNMENT_CREATED,
    data: result,
  });
});

const getAssignments = catchAsync(async (req, res) => {
  const result = await AssignmentService.getAssignments(req.user._id, req.user.role, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ASSIGNMENT_MESSAGES.ASSIGNMENTS_FETCHED,
    meta: result.meta,
    data: result.assignments,
  });
});

const getAssignmentById = catchAsync(async (req, res) => {
  const result = await AssignmentService.getAssignmentById(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ASSIGNMENT_MESSAGES.ASSIGNMENT_FETCHED,
    data: result,
  });
});

const updateAssignment = catchAsync(async (req, res) => {
  const oldAssignment = await Assignment.findById(req.params.id).select("status title description instructions dueDate totalMarks attachmentUrl");
  const result = await AssignmentService.updateAssignment(req.params.id, req.body, req.user._id, req.user.role);

  if (result.status === ASSIGNMENT_STATUS.PUBLISHED) {
    const fieldsToCheck = ["title", "description", "instructions", "dueDate", "totalMarks", "attachmentUrl"];
    const changed = fieldsToCheck.some((field) => {
      const oldVal = oldAssignment ? oldAssignment[field] : undefined;
      const newVal = result[field];
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    });

    if (changed) {
      await NotificationService.dispatchAssignmentUpdated(result, req.user._id);
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ASSIGNMENT_MESSAGES.ASSIGNMENT_UPDATED,
    data: result,
  });
});

const deleteAssignment = catchAsync(async (req, res) => {
  const result = await AssignmentService.deleteAssignment(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const AssignmentController = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
