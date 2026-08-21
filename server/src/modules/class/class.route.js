import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import optionalAuthenticate from "../../middlewares/optionalAuthenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { ClassController } from "./class.controller.js";
import { ClassValidation } from "./class.validation.js";

const router = express.Router();

router.get("/", optionalAuthenticate, ClassController.getClasses);
router.get("/:id", optionalAuthenticate, ClassController.getClassById);

router.use(authenticate, authorize(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN));

router.post(
  "/",
  validateRequest(ClassValidation.createClassSchema),
  ClassController.createClass
);

router.patch(
  "/:id",
  validateRequest(ClassValidation.updateClassSchema),
  ClassController.updateClass
);

router.delete("/:id", ClassController.softDeleteClass);

export default router;
