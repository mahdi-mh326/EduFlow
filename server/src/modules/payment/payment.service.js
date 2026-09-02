import mongoose from "mongoose";
import Payment from "./payment.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import ApiError from "../../shared/ApiError.js";
import logger from "../../shared/logger.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS,
} from "../enrollment/enrollment.constant.js";
import { PAYMENT_MESSAGES, PAYMENT_STATUS, PAYMENT_GATEWAY } from "./payment.constant.js";
import { PaymentUtils } from "./payment.utils.js";
import { EnrollmentService } from "../enrollment/enrollment.service.js";

const validateStudent = async (studentId) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
    isVerified: true,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

const validateCourse = async (courseId) => {
  const course = await Course.findOne({
    _id: courseId,
    isDeleted: { $ne: true },
    status: COURSE_STATUS.PUBLISHED,
  });

  if (!course) {
    throw new ApiError(404, PAYMENT_MESSAGES.DELETED_COURSE);
  }

  return course;
};

const validateClass = async (classId) => {
  const cls = await Class.findOne({
    _id: classId,
    isDeleted: { $ne: true },
    status: { $in: [CLASS_STATUS.UPCOMING, CLASS_STATUS.ONGOING] },
  });

  if (!cls) {
    throw new ApiError(404, "Class not found");
  }

  return cls;
};

const checkExistingEnrollment = async (studentId, courseId) => {
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  });

  if (enrollment) {
    throw new ApiError(400, PAYMENT_MESSAGES.ALREADY_ENROLLED);
  }
};

const checkExistingPaidPayment = async (studentId, courseId) => {
  const paidPayment = await Payment.findOne({
    studentId,
    courseId,
    status: PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  });

  if (paidPayment) {
    throw new ApiError(400, PAYMENT_MESSAGES.ALREADY_PAID);
  }
};

const initiatePayment = async (payload, createdBy) => {
  const { courseId, classId } = payload;

  const student = await validateStudent(createdBy);
  const course = await validateCourse(courseId);
  const cls = classId ? await validateClass(classId) : null;


  await checkExistingEnrollment(createdBy, courseId);
  await checkExistingPaidPayment(createdBy, courseId);

  const payableAmount =
    course.offerPrice != null && course.offerPrice > 0
      ? course.offerPrice
      : course.price;

  if (!payableAmount || payableAmount <= 0) {
    throw new ApiError(400, PAYMENT_MESSAGES.INVALID_AMOUNT);
  }

  const transactionId = PaymentUtils.generateTransactionId();

  if (transactionId.length > 30) {
    throw new ApiError(400, "SSLCommerz transaction ID exceeds 30 characters");
  }

  const existingPendingPayment = await Payment.findOne({
    studentId: createdBy,
    courseId,
    status: PAYMENT_STATUS.PENDING,
    isDeleted: { $ne: true },
  });

  let payment;
  if (existingPendingPayment) {
    payment = await Payment.findByIdAndUpdate(
      existingPendingPayment._id,
      {
        transactionId,
        amount: payableAmount,
        classId: cls ? cls._id : existingPendingPayment.classId,
        status: PAYMENT_STATUS.PENDING,
      },
      { new: true }
    );
  } else {
    payment = await Payment.create({
      studentId: createdBy,
      courseId,
      classId: cls ? cls._id : undefined,
      amount: payableAmount,
      currency: "BDT",
      gateway: PAYMENT_GATEWAY.SSLCOMMERZ,
      transactionId,
      status: PAYMENT_STATUS.PENDING,
      createdBy: createdBy,
    });
  }

  const backendBase =
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === "production" || process.env.RENDER
      ? "https://eduflow-backend-eqb1.onrender.com"
      : `http://localhost:${process.env.PORT || 5000}`);

  const isProd =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.PORT && process.env.PORT !== "5000");

  let successUrl = process.env.PAYMENT_SUCCESS_URL;
  let failUrl = process.env.PAYMENT_FAIL_URL;
  let cancelUrl = process.env.PAYMENT_CANCEL_URL;
  let ipnUrl = process.env.PAYMENT_IPN_URL;

  if (!successUrl || (isProd && successUrl.includes("localhost"))) {
    successUrl = `${backendBase}/api/v1/payments/success`;
  }
  if (!failUrl || (isProd && failUrl.includes("localhost"))) {
    failUrl = `${backendBase}/api/v1/payments/fail`;
  }
  if (!cancelUrl || (isProd && cancelUrl.includes("localhost"))) {
    cancelUrl = `${backendBase}/api/v1/payments/cancel`;
  }
  if (!ipnUrl || (isProd && ipnUrl.includes("localhost"))) {
    ipnUrl = `${backendBase}/api/v1/payments/ipn`;
  }

  let sslResponse;
  try {
    sslResponse = await PaymentUtils.initiateSslCommerzPayment({
      amount: payment.amount.toFixed(2),
      currency: payment.currency,
      transactionId: payment.transactionId,
      successUrl,
      failUrl,
      cancelUrl,
      ipnUrl,
      productName: course.title,
      productCategory: "Course",
      productProfile: "general",
      customerName: student.fullName || "Student",
      customerEmail: student.email || "student@eduflow.com",
      customerPhone: student.phone || "01700000000",
      customerAddress: "Dhaka, Bangladesh",
    });
  } catch (error) {
    const gatewayData = error.response?.data || error.message;
    const gatewayMessage =
      (error.response?.data?.error || "") ||
      (error.response?.data?.message || "") ||
      error.message ||
      PAYMENT_MESSAGES.STORE_CREDENTIAL_ERROR;

    throw new ApiError(400, gatewayMessage, gatewayData);
  }

  if (!sslResponse || sslResponse.status !== "SUCCESS") {
    const gatewayMessage =
      sslResponse?.error ||
      sslResponse?.message ||
      sslResponse?.failedreason ||
      PAYMENT_MESSAGES.STORE_CREDENTIAL_ERROR;

    throw new ApiError(400, gatewayMessage, sslResponse || null);
  }

  await Payment.findByIdAndUpdate(payment._id, {
    sslSessionKey: sslResponse.sessionkey,
    gatewayResponse: sslResponse,
  });

  return {
    paymentId: payment._id,
    transactionId: payment.transactionId,
    gatewayUrl: sslResponse.GatewayPageURL,
  };
};


const ensureEnrollmentForPayment = async (payment) => {
  const existing = await Enrollment.findOne({
    studentId: payment.studentId,
    courseId: payment.courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });

  if (existing) {
    if (existing.paymentStatus !== ENROLLMENT_PAYMENT_STATUS.PAID) {
      existing.paymentStatus = ENROLLMENT_PAYMENT_STATUS.PAID;
      await existing.save();
    }
    return existing;
  }

  try {
    const enrollment = await EnrollmentService.createEnrollment(
      {
        courseId: payment.courseId,
        classId: payment.classId,
        studentId: payment.studentId,
        paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      },
      payment.studentId,
      USER_ROLE.ADMIN
    );
    enrollment.paymentStatus = ENROLLMENT_PAYMENT_STATUS.PAID;
    await enrollment.save();
    return enrollment;
  } catch (error) {

    if (error instanceof ApiError && error.statusCode === 409) {
      const retry = await Enrollment.findOne({
        studentId: payment.studentId,
        courseId: payment.courseId,
        status: ENROLLMENT_STATUS.ACTIVE,
        isDeleted: { $ne: true },
      });
      if (retry) {
        if (retry.paymentStatus !== ENROLLMENT_PAYMENT_STATUS.PAID) {
          retry.paymentStatus = ENROLLMENT_PAYMENT_STATUS.PAID;
          await retry.save();
        }
        return retry;
      }
    }
    throw error;
  }
};

const finalizeVerifiedPayment = async (payment, validation) => {
  const { storeId } = PaymentUtils.getSslCommerzConfig();

  if (validation.store_id && validation.store_id !== storeId) {
    logger.error(
      `[SSLCommerz] Store ID mismatch for tran_id ${payment.transactionId}: ` +
      `gateway ${validation.store_id} vs configured ${storeId}`
    );
    throw new ApiError(400, PAYMENT_MESSAGES.STORE_MISMATCH);
  }

  if (validation.tran_id && validation.tran_id !== payment.transactionId) {
    logger.error(
      `[SSLCommerz] Transaction ID mismatch for tran_id ${payment.transactionId}`
    );
    throw new ApiError(400, PAYMENT_MESSAGES.TRANSACTION_MISMATCH);
  }

  const gatewayAmount = parseFloat(validation.amount);
  if (Number.isNaN(gatewayAmount) || Math.abs(gatewayAmount - payment.amount) > 0.01) {
    logger.error(
      `[SSLCommerz] Amount mismatch for tran_id ${payment.transactionId}: ` +
      `gateway ${validation.amount} vs stored ${payment.amount}`
    );
    throw new ApiError(400, PAYMENT_MESSAGES.AMOUNT_MISMATCH);
  }

  if (
    validation.currency &&
    validation.currency.toUpperCase() !== payment.currency.toUpperCase()
  ) {
    logger.error(
      `[SSLCommerz] Currency mismatch for tran_id ${payment.transactionId}: ` +
      `gateway ${validation.currency} vs stored ${payment.currency}`
    );
    throw new ApiError(400, PAYMENT_MESSAGES.CURRENCY_MISMATCH);
  }

  payment.status = PAYMENT_STATUS.PAID;
  payment.bankTransactionId = validation.bank_tran_id || payment.bankTransactionId;
  payment.valId = validation.val_id || payment.valId;
  payment.paidAt = new Date();
  payment.gatewayResponse = validation;
  await payment.save();

  await ensureEnrollmentForPayment(payment);

  return payment;
};

const handlePaymentSuccess = async (params) => {
  const { tran_id, val_id } = params;

  if (!tran_id) {
    throw new ApiError(400, PAYMENT_MESSAGES.CALLBACK_INVALID);
  }

  const payment = await Payment.findOne({
    transactionId: tran_id,
    isDeleted: { $ne: true },
  });

  if (!payment) {
    throw new ApiError(404, PAYMENT_MESSAGES.PAYMENT_NOT_FOUND);
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    await ensureEnrollmentForPayment(payment);
    return {
      success: true,
      status: PAYMENT_STATUS.PAID,
      paymentId: payment._id,
      transactionId: payment.transactionId,
    };
  }

  if (payment.status !== PAYMENT_STATUS.PENDING) {
    return {
      success: false,
      status: payment.status,
      paymentId: payment._id,
      transactionId: payment.transactionId,
    };
  }

  if (!val_id) {
    throw new ApiError(400, PAYMENT_MESSAGES.VAL_ID_MISSING);
  }

  let validation;
  try {
    validation = await PaymentUtils.validateSslCommerzTransaction(val_id);
  } catch (error) {
    logger.error(
      `[SSLCommerz] Validation request failed for tran_id ${tran_id}: ${error.message}`
    );
    throw new ApiError(502, PAYMENT_MESSAGES.VALIDATION_FAILED);
  }

  if (!["VALID", "VALIDATED"].includes(validation.status)) {
    logger.error(
      `[SSLCommerz] Success callback validation failed for tran_id ${tran_id}: ` +
      `status ${validation.status}`
    );
    throw new ApiError(400, PAYMENT_MESSAGES.VALIDATION_FAILED);
  }

  await finalizeVerifiedPayment(payment, validation);

  return {
    success: true,
    status: PAYMENT_STATUS.PAID,
    paymentId: payment._id,
    transactionId: payment.transactionId,
  };
};

const handlePaymentFail = async (params) => {
  const { tran_id } = params;

  if (!tran_id) {
    throw new ApiError(400, PAYMENT_MESSAGES.CALLBACK_INVALID);
  }

  const payment = await Payment.findOne({
    transactionId: tran_id,
    isDeleted: { $ne: true },
  });

  if (!payment) {
    throw new ApiError(404, PAYMENT_MESSAGES.PAYMENT_NOT_FOUND);
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    return {
      success: false,
      status: PAYMENT_STATUS.PAID,
      paymentId: payment._id,
      transactionId: payment.transactionId,
    };
  }

  payment.status = PAYMENT_STATUS.FAILED;
  payment.gatewayResponse = params;
  await payment.save();

  return {
    success: false,
    status: PAYMENT_STATUS.FAILED,
    paymentId: payment._id,
    transactionId: payment.transactionId,
  };
};

const handlePaymentCancel = async (params) => {
  const { tran_id } = params;

  if (!tran_id) {
    throw new ApiError(400, PAYMENT_MESSAGES.CALLBACK_INVALID);
  }

  const payment = await Payment.findOne({
    transactionId: tran_id,
    isDeleted: { $ne: true },
  });

  if (!payment) {
    throw new ApiError(404, PAYMENT_MESSAGES.PAYMENT_NOT_FOUND);
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    return {
      success: false,
      status: PAYMENT_STATUS.PAID,
      paymentId: payment._id,
      transactionId: payment.transactionId,
    };
  }

  payment.status = PAYMENT_STATUS.CANCELLED;
  payment.gatewayResponse = params;
  await payment.save();

  return {
    success: false,
    status: PAYMENT_STATUS.CANCELLED,
    paymentId: payment._id,
    transactionId: payment.transactionId,
  };
};

const handlePaymentIpn = async (params) => {
  const { tran_id, val_id, status } = params;

  if (!tran_id) {
    throw new ApiError(400, PAYMENT_MESSAGES.CALLBACK_INVALID);
  }

  const payment = await Payment.findOne({
    transactionId: tran_id,
    isDeleted: { $ne: true },
  });

  if (!payment) {
    throw new ApiError(404, PAYMENT_MESSAGES.PAYMENT_NOT_FOUND);
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    await ensureEnrollmentForPayment(payment);
    return {
      success: true,
      status: PAYMENT_STATUS.PAID,
      paymentId: payment._id,
      transactionId: payment.transactionId,
    };
  }

  let outcomeStatus = status;
  let validation = null;

  if (val_id) {
    validation = await PaymentUtils.validateSslCommerzTransaction(val_id);
    outcomeStatus = validation.status;
  }

  if (["VALID", "VALIDATED"].includes(outcomeStatus)) {
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      return {
        success: false,
        status: payment.status,
        paymentId: payment._id,
        transactionId: payment.transactionId,
      };
    }

    await finalizeVerifiedPayment(payment, validation);

    return {
      success: true,
      status: PAYMENT_STATUS.PAID,
      paymentId: payment._id,
      transactionId: payment.transactionId,
    };
  }

  if (outcomeStatus === "FAILED" || outcomeStatus === "CANCELLED") {
    payment.status =
      outcomeStatus === "FAILED"
        ? PAYMENT_STATUS.FAILED
        : PAYMENT_STATUS.CANCELLED;
    payment.gatewayResponse = validation || params;
    await payment.save();

    return {
      success: false,
      status: payment.status,
      paymentId: payment._id,
      transactionId: payment.transactionId,
    };
  }

  logger.error(
    `[SSLCommerz] IPN unknown status ${outcomeStatus} for tran_id ${tran_id}`
  );
  throw new ApiError(400, PAYMENT_MESSAGES.VALIDATION_FAILED);
};

const getStudentPayments = async (studentId) => {
  const payments = await Payment.find({
    studentId,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug thumbnail price")
    .populate("classId", "batchName startDate endDate")
    .sort({ createdAt: -1 });

  return payments;
};

const getPayments = async (query) => {
  const {
    page = 1,
    limit = 10,
    courseId,
    teacherId,
    studentId,
    status,
    sortBy = "newest",
    sortOrder = "desc",
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: { $ne: true } };

  if (courseId) filter.courseId = courseId;
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;

  let sort = {};
  switch (sortBy) {
    case "amount":
      sort = { amount: sortOrder === "asc" ? 1 : -1 };
      break;
    case "date":
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
  }

  const [countResult, payments] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("studentId", "fullName email phone")
      .populate("courseId", "title slug price")
      .populate("classId", "batchName startDate endDate"),
  ]);

  const total = countResult;
  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    payments,
  };
};

const getPaymentById = async (id) => {
  const payment = await Payment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email phone")
    .populate("courseId", "title slug price")
    .populate("classId", "batchName startDate endDate");

  if (!payment) {
    throw new ApiError(404, PAYMENT_MESSAGES.PAYMENT_NOT_FOUND);
  }

  return payment;
};

const getPaymentByTranId = async (transactionId, userId, role) => {
  const filter = {
    transactionId,
    isDeleted: { $ne: true },
  };

  if (role === USER_ROLE.STUDENT) {
    filter.studentId = userId;
  }

  const payment = await Payment.findOne(filter)
    .populate("studentId", "fullName email phone")
    .populate("courseId", "title slug price offerPrice thumbnail")
    .populate("classId", "batchName startDate endDate");

  if (!payment) {
    throw new ApiError(404, PAYMENT_MESSAGES.PAYMENT_NOT_FOUND);
  }

  return payment;
};

export const PaymentService = {
  initiatePayment,
  handlePaymentSuccess,
  handlePaymentFail,
  handlePaymentCancel,
  handlePaymentIpn,
  getStudentPayments,
  getPayments,
  getPaymentById,
  getPaymentByTranId,
};

