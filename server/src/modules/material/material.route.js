import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { USER_ROLE } from "../user/user.constant.js";
import { MaterialController } from "./material.controller.js";
import { MaterialValidation } from "./material.validation.js";

const router = express.Router();

router.get("/", authenticate, MaterialController.getMaterials);

router.get("/:id", authenticate, MaterialController.getMaterialById);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  MaterialController.createMaterial
);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  MaterialController.updateMaterial
);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  MaterialController.deleteMaterial
);

export default router;
