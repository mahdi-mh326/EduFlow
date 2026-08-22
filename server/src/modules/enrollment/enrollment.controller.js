import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import ApiError from "../../shared/ApiError.js";
import { EnrollmentService } from "./enrollment.service.js";
import { ENROLLMENT_MESSAGES } from "./enrollment.constant.js";
import { NotificationService } from "../notification/notification.service.js";

const createEnrollment = catchAsync(async (req, res) => {
  let { studentId, courseId } = req.body;

  if (req.user.role === "student") {
    if (studentId && studentId !== req.user._id.toString()) {
      throw new ApiError(403, "You can only create enrollment for yourself");
    }
    studentId = req.user._id;
  }

  const result = await EnrollmentService.createEnrollment(
    { courseId, studentId },
    req.user._id,
    req.user.role
  );
  await NotificationService.dispatchEnrollmentCreated(result, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: ENROLLMENT_MESSAGES.ENROLLMENT_CREATED,
    data: result,
  });
});

const getEnrollments = catchAsync(async (req, res) => {
  const result = await EnrollmentService.getEnrollments(req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrollments retrieved successfully",
    data: result,
  });
});

const getEnrollmentById = catchAsync(async (req, res) => {
  const result = await EnrollmentService.getEnrollmentById(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrollment retrieved successfully",
    data: result,
  });
});

const deleteEnrollment = catchAsync(async (req, res) => {
  const result = await EnrollmentService.deleteEnrollment(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const EnrollmentController = {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  deleteEnrollment,
};
