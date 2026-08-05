import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { AdminService } from "./admin.service.js";

const createAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.createAdmin(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin created successfully.",
    data: result,
  });
});

export const AdminController = { createAdmin };
