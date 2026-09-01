import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorizeMasterAdmin from "../../middlewares/authorizeMasterAdmin.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { AdminValidation } from "./admin.validation.js";
import { AdminController } from "./admin.controller.js";

const router = express.Router();

router.use(authenticate, authorizeMasterAdmin);

router.get("/", AdminController.getAdmins);

router.post(
  "/",
  validateRequest(AdminValidation.createAdminSchema),
  AdminController.createAdmin
);

router.patch(
  "/:id/status",
  AdminController.updateAdminStatus
);

router.delete(
  "/:id",
  AdminController.deleteAdmin
);

export default router;

