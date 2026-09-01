import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { ClassService } from "./class.service.js";
import { CLASS_MESSAGES } from "./class.constant.js";

const createClass = catchAsync(async (req, res) => {
  const result = await ClassService.createClass(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: CLASS_MESSAGES.CLASS_CREATED,
    data: result,
  });
});

const getClasses = catchAsync(async (req, res) => {
  const result = await ClassService.getClasses(req.query, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Classes retrieved successfully",
    meta: result.meta,
    data: result.classes,
  });
});

const getClassById = catchAsync(async (req, res) => {
  const result = await ClassService.getClassById(req.params.id, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class retrieved successfully",
    data: result,
  });
});


const updateClass = catchAsync(async (req, res) => {
  const result = await ClassService.updateClass(req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: CLASS_MESSAGES.CLASS_UPDATED,
    data: result,
  });
});

const softDeleteClass = catchAsync(async (req, res) => {
  const result = await ClassService.softDeleteClass(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const ClassController = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  softDeleteClass,
};
