import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { USER_ROLE } from "../user/user.constant.js";
import { NoticeController } from "./notice.controller.js";
import { NoticeValidation } from "./notice.validation.js";

const router = express.Router();

router.get("/", authenticate, NoticeController.getNotices);

router.get("/:id", authenticate, NoticeController.getNoticeById);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  NoticeController.createNotice
);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  NoticeController.updateNotice
);

router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  NoticeController.deleteNotice
);

export default router;
