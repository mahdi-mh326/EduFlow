import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { UserService } from "./user.service.js";
import ApiError from "../../shared/ApiError.js";
import { uploadStreamToCloudinary } from "../../config/cloudinary.js";

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

const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const uploadResult = await uploadStreamToCloudinary(req.file.buffer, {
    folder: "eduflow/avatars",
    resource_type: "image",
  });
  const avatarUrl = uploadResult.url;

  const result = await UserService.updateProfile(req.user._id, { avatar: avatarUrl });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Avatar uploaded successfully",
    data: {
      avatar: avatarUrl,
      user: result,
    },
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
  uploadAvatar,
  changePassword,
};
