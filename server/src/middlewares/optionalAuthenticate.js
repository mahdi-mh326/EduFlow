import { tokenUtils } from "../modules/auth/auth.token.js";
import User from "../modules/user/user.model.js";
import { USER_STATUS } from "../modules/user/user.constant.js";

const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return next();

    const decoded = tokenUtils.verifyAccessToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (user && user.status !== USER_STATUS.BLOCKED && user.isVerified) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

export default optionalAuthenticate;
