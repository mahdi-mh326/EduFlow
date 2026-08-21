import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { NotificationService } from "./notification.service.js";

const getNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.getNotifications(req.user._id, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications fetched successfully",
    meta: result.meta,
    data: result.notifications,
  });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const count = await NotificationService.getUnreadCount(req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Unread count fetched successfully",
    data: { count },
  });
});

const markAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAsRead(req.params.id, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAllAsRead(req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All notifications marked as read",
    data: result,
  });
});

const deleteNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.deleteNotification(req.params.id, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const NotificationController = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
