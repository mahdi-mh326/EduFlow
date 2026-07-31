import User from "./user.model.js";
import ApiError from "../../shared/ApiError.js";

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const updateProfile = async (userId, payload) => {
  const { fullName, phone, gender, avatar, dateOfBirth } = payload;

  if (phone) {
    const existing = await User.findOne({ phone, _id: { $ne: userId } });
    if (existing) {
      throw new ApiError(409, "Phone number already in use");
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { fullName, phone, gender, avatar, dateOfBirth },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from current password.");
  }

  user.password = newPassword;
  await user.save();
};

export const UserService = {
  getMe,
  updateProfile,
  changePassword,
};
