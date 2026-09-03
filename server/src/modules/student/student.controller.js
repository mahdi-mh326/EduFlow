import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { StudentService } from "./student.service.js";
import { STUDENT_MESSAGES } from "./student.constant.js";

const getStudentDashboard = catchAsync(async (req, res) => {
  const result = await StudentService.getStudentDashboard(req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: STUDENT_MESSAGES.DASHBOARD_FETCHED,
    data: result,
  });
});

const getAllStudents = catchAsync(async (req, res) => {
  const result = await StudentService.getAllStudents(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Students retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getStudentById = catchAsync(async (req, res) => {
  const result = await StudentService.getStudentById(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student details retrieved successfully",
    data: result,
  });
});

const updateStudentStatus = catchAsync(async (req, res) => {
  const result = await StudentService.updateStudentStatus(req.params.id, req.body.status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student status updated successfully",
    data: result,
  });
});

const getStudentsStats = catchAsync(async (req, res) => {
  const result = await StudentService.getStudentsStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Students statistics retrieved successfully",
    data: result,
  });
});

const deleteStudent = catchAsync(async (req, res) => {
  const result = await StudentService.deleteStudent(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

const warnStudent = catchAsync(async (req, res) => {
  const result = await StudentService.warnStudent(req.params.id, req.body, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

export const StudentController = {
  getStudentDashboard,
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  getStudentsStats,
  deleteStudent,
  warnStudent,
};


