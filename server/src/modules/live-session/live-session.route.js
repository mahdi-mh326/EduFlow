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

router.post(
  "/class/:classId/start",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  LiveSessionController.startClassLive
);

router.post(
  "/class/:classId/end",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  LiveSessionController.endClassLive
);

router.get(
  "/class/:classId/active",
  authenticate,
  LiveSessionController.getActiveClassLive
);

router.post(
  "/:id/start",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  LiveSessionController.startSession
);

router.post(
  "/:id/end",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  LiveSessionController.endSession
);

export default router;

