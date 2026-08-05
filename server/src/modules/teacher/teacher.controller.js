import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { TeacherService } from "./teacher.service.js";

const createTeacher = catchAsync(async (req, res) => {
  const result = await TeacherService.createTeacher(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Teacher created successfully",
    data: result,
  });
});

const getTeachers = catchAsync(async (req, res) => {
  const { meta, teachers } = await TeacherService.getTeachers(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teachers retrieved successfully",
    meta,
    data: teachers,
  });
});

const getTeacher = catchAsync(async (req, res) => {
  const result = await TeacherService.getTeacher(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher retrieved successfully",
    data: result,
  });
});

const updateTeacher = catchAsync(async (req, res) => {
  const result = await TeacherService.updateTeacher(req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher updated successfully",
    data: result,
  });
});

const updateTeacherStatus = catchAsync(async (req, res) => {
  const result = await TeacherService.updateTeacherStatus(req.params.id, req.body.status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher status updated successfully",
    data: result,
  });
});

const deleteTeacher = catchAsync(async (req, res) => {
  await TeacherService.deleteTeacher(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher deleted successfully",
    data: null,
  });
});

export const TeacherController = {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  updateTeacherStatus,
  deleteTeacher,
};
