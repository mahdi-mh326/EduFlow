import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { UserService } from "./user.service.js";

const getMe = catchAsync(async (req, res) => {
  const result = await UserService.getMe(req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await UserService.updateProfile(req.user._id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  await UserService.changePassword(req.user._id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

export const UserController = {
  getMe,
  updateProfile,
  changePassword,
};
