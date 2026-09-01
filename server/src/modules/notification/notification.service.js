import mongoose from "mongoose";
import Notification from "./notification.model.js";
import User from "../user/user.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { ENROLLMENT_STATUS, PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS } from "../enrollment/enrollment.constant.js";
import { ASSIGNMENT_STATUS } from "../assignment/assignment.constant.js";
import { QUIZ_STATUS } from "../quiz/quiz.constant.js";
import { NOTIFICATION_TYPE, NOTIFICATION_MESSAGES } from "./notification.constant.js";
import ApiError from "../../shared/ApiError.js";
import sendEmail from "../../utils/email/sendEmail.js";
import { notificationEmailTemplates } from "../../utils/email/notification.templates.js";
import logger from "../../shared/logger.js";

const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  data = {},
  resourceId = null,
  createdBy = null,
}) => {
  if (resourceId) {
    const existing = await Notification.findOne({
      recipientId,
      type,
      resourceId,
      isDeleted: { $ne: true },
    });
    if (existing) {
      return existing;
    }
  }

  const notification = await Notification.create({
    recipientId,
    type,
    title,
    message,
    data,
    resourceId,
    createdBy,
  });

  return notification;
};

const bulkCreateNotifications = async (notifications) => {
  const filtered = [];
  for (const n of notifications) {
    if (n.resourceId) {
      const exists = await Notification.findOne({
        recipientId: n.recipientId,
        type: n.type,
        resourceId: n.resourceId,
        isDeleted: { $ne: true },
      });
      if (exists) continue;
    }
    filtered.push({
      ...n,
      isRead: false,
      readAt: null,
      isDeleted: false,
      deletedAt: null,
    });
  }

  if (filtered.length === 0) return [];

  const result = await Notification.insertMany(filtered);
  return result;
};

const getNotifications = async (userId, query = {}) => {
  const { page = 1, limit = 10, type } = query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const filter = { recipientId: userId, isDeleted: { $ne: true } };
  if (type) {
    filter.type = type;
  }

  const [countResult, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "fullName email")
      .select("-isDeleted -deletedAt"),
  ]);

  const total = countResult;
  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: { total, page: pageNum, limit: limitNum, totalPages },
    notifications,
  };
};

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    recipientId: userId,
    isRead: false,
    isDeleted: { $ne: true },
  });
};

const markAsRead = async (notificationId, userId) => {
  let notification;
  try {
    notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId,
      isDeleted: { $ne: true },
    });
  } catch (error) {
    if (error.name === "CastError") {
      throw new ApiError(404, "Notification not found");
    }
    throw error;
  }

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipientId: userId, isRead: false, isDeleted: { $ne: true } },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return result;
};

const deleteNotification = async (notificationId, userId) => {
  let notification;
  try {
    notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId,
      isDeleted: { $ne: true },
    });
  } catch (error) {
    if (error.name === "CastError") {
      throw new ApiError(404, "Notification not found");
    }
    throw error;
  }

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  await Notification.findByIdAndUpdate(notificationId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: "Notification deleted successfully" };
};

const sendEmailForNotification = async (notification) => {
  try {
    const recipient = await User.findOne({
      _id: notification.recipientId,
      isDeleted: { $ne: true },
    }).select("fullName email");

    if (!recipient || !recipient.email) {
      return;
    }

    const templateFn = notificationEmailTemplates[notification.type];
    if (!templateFn) return;

    const html = templateFn(recipient.fullName, notification.data, notification.message);
    if (!html) return;

    const subject = notification.title;

    await sendEmail({ to: recipient.email, subject, html });
  } catch (error) {
    logger.error(`Failed to send notification email for ${notification.type}: ${error.message}`);
  }
};

const getEligibleStudentIds = async (classId) => {
  const rawClassId = classId instanceof mongoose.Types.ObjectId ? classId : (classId?._id || classId);
  if (rawClassId) {
    return await Enrollment.find({
      classId: rawClassId,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    }).distinct("studentId");
  }

  return await User.find({
    role: USER_ROLE.STUDENT,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    isDeleted: { $ne: true },
  }).distinct("_id");
};

const dispatchNoticeCreated = async (notice, actorId) => {
  let recipientIds = [];

  if (notice.classId) {
    recipientIds = await getEligibleStudentIds(notice.classId);
  } else {
    const filter = { isDeleted: { $ne: true }, status: "active" };
    if (notice.targetAudience === "teachers") {
      filter.role = USER_ROLE.TEACHER;
    } else if (notice.targetAudience === "students") {
      filter.role = USER_ROLE.STUDENT;
    } else {
      filter.role = { $in: [USER_ROLE.STUDENT, USER_ROLE.TEACHER] };
    }
    recipientIds = await User.find(filter).distinct("_id");
  }

  recipientIds = recipientIds.filter((id) => id && id.toString() !== actorId.toString());

  const notifications = recipientIds.map((recipientId) => ({
    recipientId,
    type: NOTIFICATION_TYPE.NOTICE_CREATED,
    title: NOTIFICATION_MESSAGES.NOTICE_CREATED,
    message: `A new notice has been published: ${notice.title}`,
    data: { noticeId: notice._id, classId: notice.classId, courseId: notice.courseId },
    resourceId: `${NOTIFICATION_TYPE.NOTICE_CREATED}_${notice._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};


const dispatchEnrollmentCreated = async (enrollment, actorId) => {
  const student = await User.findById(enrollment.studentId).select("fullName email");
  if (!student) return;

  const notification = await createNotification({
    recipientId: enrollment.studentId,
    type: NOTIFICATION_TYPE.ENROLLMENT_CREATED,
    title: NOTIFICATION_MESSAGES.ENROLLMENT_CREATED,
    message: `You have successfully enrolled in the course.`,
    data: { enrollmentId: enrollment._id, courseId: enrollment.courseId, classId: enrollment.classId },
    resourceId: `${NOTIFICATION_TYPE.ENROLLMENT_CREATED}_${enrollment._id}`,
    createdBy: actorId,
  });

  sendEmailForNotification(notification);
};

const dispatchPaymentSuccess = async (payment, actorId) => {
  const student = await User.findById(payment.studentId).select("fullName email");
  if (!student) return;

  const notification = await createNotification({
    recipientId: payment.studentId,
    type: NOTIFICATION_TYPE.PAYMENT_SUCCESS,
    title: NOTIFICATION_MESSAGES.PAYMENT_SUCCESS,
    message: `Your payment of ${payment.amount} ${payment.currency} was successful.`,
    data: { paymentId: payment._id, transactionId: payment.transactionId, courseId: payment.courseId, amount: payment.amount },
    resourceId: `${NOTIFICATION_TYPE.PAYMENT_SUCCESS}_${payment._id}`,
    createdBy: actorId,
  });

  sendEmailForNotification(notification);
};

const dispatchPaymentFailed = async (payment, actorId) => {
  const student = await User.findById(payment.studentId).select("fullName email");
  if (!student) return;

  const notification = await createNotification({
    recipientId: payment.studentId,
    type: NOTIFICATION_TYPE.PAYMENT_FAILED,
    title: NOTIFICATION_MESSAGES.PAYMENT_FAILED,
    message: `Your payment of ${payment.amount} ${payment.currency} failed.`,
    data: { paymentId: payment._id, transactionId: payment.transactionId, courseId: payment.courseId, amount: payment.amount },
    resourceId: `${NOTIFICATION_TYPE.PAYMENT_FAILED}_${payment._id}`,
    createdBy: actorId,
  });

  sendEmailForNotification(notification);
};

const dispatchLiveSessionScheduled = async (session, actorId) => {
  const studentIds = await getEligibleStudentIds(session.classId);
  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.LIVE_SESSION_SCHEDULED,
    title: NOTIFICATION_MESSAGES.LIVE_SESSION_SCHEDULED,
    message: `A new live class has been scheduled: ${session.title}`,
    data: { liveSessionId: session._id, classId: session.classId, courseId: session.courseId, scheduledDate: session.scheduledDate, startTime: session.startTime },
    resourceId: `${NOTIFICATION_TYPE.LIVE_SESSION_SCHEDULED}_${session._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

const dispatchLiveSessionUpdated = async (session, actorId) => {
  const studentIds = await getEligibleStudentIds(session.classId);
  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.LIVE_SESSION_UPDATED,
    title: NOTIFICATION_MESSAGES.LIVE_SESSION_UPDATED,
    message: `A live class has been updated: ${session.title}`,
    data: { liveSessionId: session._id, classId: session.classId, courseId: session.courseId },
    resourceId: `${NOTIFICATION_TYPE.LIVE_SESSION_UPDATED}_${session._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

const dispatchLiveSessionCancelled = async (session, actorId) => {
  const studentIds = await getEligibleStudentIds(session.classId);
  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.LIVE_SESSION_CANCELLED,
    title: NOTIFICATION_MESSAGES.LIVE_SESSION_CANCELLED,
    message: `A live class has been cancelled: ${session.title}`,
    data: { liveSessionId: session._id, classId: session.classId, courseId: session.courseId },
    resourceId: `${NOTIFICATION_TYPE.LIVE_SESSION_CANCELLED}_${session._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

const dispatchLiveSessionStarted = async (session, actorId) => {
  const studentIds = await getEligibleStudentIds(session.classId);
  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.LIVE_SESSION_STARTED,
    title: NOTIFICATION_MESSAGES.LIVE_SESSION_STARTED,
    message: `A live class has started: ${session.title}`,
    data: { liveSessionId: session._id, classId: session.classId, courseId: session.courseId },
    resourceId: `${NOTIFICATION_TYPE.LIVE_SESSION_STARTED}_${session._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

const dispatchAssignmentCreated = async (assignment, actorId) => {
  if (assignment.status !== ASSIGNMENT_STATUS.PUBLISHED) return;

  const studentIds = await Enrollment.find({
    classId: assignment.classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  }).distinct("studentId");

  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.ASSIGNMENT_CREATED,
    title: NOTIFICATION_MESSAGES.ASSIGNMENT_CREATED,
    message: `A new assignment has been published: ${assignment.title}`,
    data: { assignmentId: assignment._id, classId: assignment.classId, courseId: assignment.courseId, dueDate: assignment.dueDate },
    resourceId: `${NOTIFICATION_TYPE.ASSIGNMENT_CREATED}_${assignment._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

const dispatchAssignmentUpdated = async (assignment, actorId) => {
  if (assignment.status !== ASSIGNMENT_STATUS.PUBLISHED) return;

  const studentIds = await Enrollment.find({
    classId: assignment.classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  }).distinct("studentId");

  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.ASSIGNMENT_UPDATED,
    title: NOTIFICATION_MESSAGES.ASSIGNMENT_UPDATED,
    message: `An assignment has been updated: ${assignment.title}`,
    data: { assignmentId: assignment._id, classId: assignment.classId, courseId: assignment.courseId },
    resourceId: `${NOTIFICATION_TYPE.ASSIGNMENT_UPDATED}_${assignment._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

const dispatchQuizCreated = async (quiz, actorId) => {
  if (quiz.status !== QUIZ_STATUS.PUBLISHED) return;

  const rawClassId = typeof quiz.classId === 'object' && quiz.classId !== null ? quiz.classId._id : quiz.classId;

  const studentIds = await Enrollment.find({
    classId: rawClassId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  }).distinct("studentId");

  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.QUIZ_CREATED,
    title: NOTIFICATION_MESSAGES.QUIZ_CREATED,
    message: `A new quiz has been published: ${quiz.title}`,
    data: { quizId: quiz._id, classId: quiz.classId, courseId: quiz.courseId, startDate: quiz.startDate, endDate: quiz.endDate },
    resourceId: `${NOTIFICATION_TYPE.QUIZ_CREATED}_${quiz._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

const dispatchQuizUpdated = async (quiz, actorId) => {
  if (quiz.status !== QUIZ_STATUS.PUBLISHED) return;

  const studentIds = await Enrollment.find({
    classId: quiz.classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  }).distinct("studentId");

  const notifications = studentIds.map((studentId) => ({
    recipientId: studentId,
    type: NOTIFICATION_TYPE.QUIZ_UPDATED,
    title: NOTIFICATION_MESSAGES.QUIZ_UPDATED,
    message: `A quiz has been updated: ${quiz.title}`,
    data: { quizId: quiz._id, classId: quiz.classId, courseId: quiz.courseId },
    resourceId: `${NOTIFICATION_TYPE.QUIZ_UPDATED}_${quiz._id}`,
    createdBy: actorId,
  }));

  const created = await bulkCreateNotifications(notifications);
  created.forEach((n) => sendEmailForNotification(n));
};

export const NotificationService = {
  createNotification,
  bulkCreateNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendEmailForNotification,
  dispatchNoticeCreated,
  dispatchEnrollmentCreated,
  dispatchPaymentSuccess,
  dispatchPaymentFailed,
  dispatchLiveSessionScheduled,
  dispatchLiveSessionUpdated,
  dispatchLiveSessionCancelled,
  dispatchLiveSessionStarted,
  dispatchAssignmentCreated,
  dispatchAssignmentUpdated,
  dispatchQuizCreated,
  dispatchQuizUpdated,
};
