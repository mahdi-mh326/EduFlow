import User from "./user.model.js";
import ApiError from "../../shared/ApiError.js";

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const UserService = {
  getMe,
};
