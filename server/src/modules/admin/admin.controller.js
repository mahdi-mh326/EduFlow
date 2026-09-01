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

const getAdmins = catchAsync(async (req, res) => {
  const result = await AdminService.getAdmins(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admins retrieved successfully",
    meta: result.meta,
    data: result.admins,
  });
});

const updateAdminStatus = catchAsync(async (req, res) => {
  const result = await AdminService.updateAdminStatus(req.params.id, req.body.status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin status updated successfully.",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.deleteAdmin(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

export const AdminController = { createAdmin, getAdmins, updateAdminStatus, deleteAdmin };

