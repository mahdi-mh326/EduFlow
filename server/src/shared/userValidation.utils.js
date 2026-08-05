import User from "../modules/user/user.model.js";
import ApiError from "./ApiError.js";

export const checkDuplicateEmail = async (email) => {
  const exists = await User.findOne({ email }, { _id: 1 }).lean();
  if (exists) throw new ApiError(409, "Email already in use.");
};

export const checkDuplicatePhone = async (phone) => {
  const exists = await User.findOne({ phone }, { _id: 1 }).lean();
  if (exists) throw new ApiError(409, "Phone number already in use.");
};
