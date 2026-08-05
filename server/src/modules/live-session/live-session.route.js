import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { USER_ROLE } from "../user/user.constant.js";
import { LiveSessionController } from "./live-session.controller.js";
import { LiveSessionValidation } from "./live-session.validation.js";

const router = express.Router();

router.get("/", authenticate, LiveSessionController.getLiveSessions);

router.get("/:id", authenticate, LiveSessionController.getLiveSessionById);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  LiveSessionController.createLiveSession
);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  LiveSessionController.updateLiveSession
);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  LiveSessionController.deleteLiveSession
);

router.get(
  "/student/live-sessions",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  LiveSessionController.getStudentLiveSessions
);

export default router;
