import User from "./user.model.js";
import TeacherProfile from "../teacher/teacher.model.js";
import ApiError from "../../shared/ApiError.js";

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "teacher") {
    const teacherProfile = await TeacherProfile.findOne({ userId }).lean();
    if (teacherProfile) {
      user.teacherProfile = teacherProfile;
    }
  }

  user.id = user._id.toString();

  return user;
};




const updateProfile = async (userId, payload) => {
  const updateData = {};

  if (payload.fullName !== undefined && payload.fullName !== "") {
    updateData.fullName = payload.fullName.trim();
  }

  if (payload.phone !== undefined && payload.phone !== "") {
    const existing = await User.findOne({ phone: payload.phone, _id: { $ne: userId } });
    if (existing) {
      throw new ApiError(409, "Phone number already in use");
    }
    updateData.phone = payload.phone;
  }

  if (payload.gender !== undefined) {
    updateData.gender = payload.gender || "other";
  }

  if (payload.avatar !== undefined) {
    updateData.avatar = payload.avatar;
  }

  if (payload.dateOfBirth !== undefined) {
    updateData.dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "teacher") {
    const teacherUpdates = {};
    if (payload.qualification !== undefined && payload.qualification !== "") {
      teacherUpdates.qualification = payload.qualification.trim();
    }

    let teacherProfile;
    if (Object.keys(teacherUpdates).length > 0) {
      teacherProfile = await TeacherProfile.findOneAndUpdate(
        { userId },
        { $set: teacherUpdates },
        { new: true, runValidators: true }
      ).lean();
    } else {
      teacherProfile = await TeacherProfile.findOne({ userId }).lean();
    }

    if (teacherProfile) {
      user.teacherProfile = teacherProfile;
    }
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
