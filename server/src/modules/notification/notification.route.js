import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import { NotificationController } from "./notification.controller.js";

const router = express.Router();

router.get("/", authenticate, NotificationController.getNotifications);
router.get("/unread-count", authenticate, NotificationController.getUnreadCount);
router.patch("/:id/read", authenticate, NotificationController.markAsRead);
router.patch("/read-all", authenticate, NotificationController.markAllAsRead);
router.delete("/:id", authenticate, NotificationController.deleteNotification);

export default router;
