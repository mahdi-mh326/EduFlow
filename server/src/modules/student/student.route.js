import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { USER_ROLE } from "../user/user.constant.js";
import { StudentController } from "./student.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  StudentController.getStudentDashboard
);

export default router;
