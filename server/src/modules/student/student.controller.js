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

export const StudentController = {
  getStudentDashboard,
};
