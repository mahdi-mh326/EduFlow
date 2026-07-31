import { jwtUtils } from "../utils/jwtUtils.js";
import ApiError from "../shared/ApiError.js";

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "No token provided");
  }

  try {
    const decoded = jwtUtils.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
};

export default authenticate;
