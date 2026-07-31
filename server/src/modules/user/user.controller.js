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

export const UserController = {
  getMe,
};
