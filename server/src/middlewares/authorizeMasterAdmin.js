import ApiError from "../shared/ApiError.js";
import { USER_ROLE } from "../modules/user/user.constant.js";

const authorizeMasterAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== USER_ROLE.ADMIN || !req.user.isMasterAdmin) {
    return next(new ApiError(403, "Access restricted. Only Master Admin can manage administrators."));
  }
  next();
};

export default authorizeMasterAdmin;
