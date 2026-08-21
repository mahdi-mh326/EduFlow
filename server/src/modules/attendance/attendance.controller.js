import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { AttendanceService } from "./attendance.service.js";
import { ATTENDANCE_MESSAGES } from "./attendance.constant.js";
import { AttendanceValidation } from "./attendance.validation.js";

const startAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceService.startAttendance(req.body.liveSessionId, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTENDANCE_MESSAGES.ATTENDANCE_STARTED,
    data: result,
  });
});

const submitAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceService.submitAttendance(
    req.body.liveSessionId,
    req.body.students,
    req.user._id
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: ATTENDANCE_MESSAGES.ATTENDANCE_SUBMITTED,
    data: result,
  });
});

const updateAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceService.updateAttendance(req.params.id, req.body, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTENDANCE_MESSAGES.ATTENDANCE_UPDATED,
    data: result,
  });
});

const getAttendances = catchAsync(async (req, res) => {
  const result = await AttendanceService.getAttendances(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTENDANCE_MESSAGES.ATTENDANCES_FETCHED,
    meta: result.meta,
    data: result.attendances,
  });
});

const getAttendanceReport = catchAsync(async (req, res) => {
  const result = await AttendanceService.getAttendanceReport(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance report fetched successfully",
    data: result,
  });
});

const getStudentAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceService.getStudentAttendance(
    req.user._id,
    req.query.page,
    req.query.limit
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: ATTENDANCE_MESSAGES.ATTENDANCES_FETCHED,
    meta: result.meta,
    data: result.data,
  });
});

export const AttendanceController = {
  startAttendance,
  submitAttendance,
  updateAttendance,
  getAttendances,
  getAttendanceReport,
  getStudentAttendance,
};
