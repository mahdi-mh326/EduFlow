import { tokenUtils } from "../modules/auth/auth.token.js";
import ApiError from "../shared/ApiError.js";
import User from "../modules/user/user.model.js";
import { USER_STATUS } from "../modules/user/user.constant.js";

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "No token provided");
    }

    const decoded = tokenUtils.verifyAccessToken(token);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ApiError(403, "Your account is not active");
    }

    if (!user.isVerified) {
      throw new ApiError(403, "Please verify your email first");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
