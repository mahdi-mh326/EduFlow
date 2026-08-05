import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { AdminValidation } from "./admin.validation.js";
import { AdminController } from "./admin.controller.js";
import { USER_ROLE } from "../user/user.constant.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.SUPER_ADMIN),
  validateRequest(AdminValidation.createAdminSchema),
  AdminController.createAdmin
);

export default router;
