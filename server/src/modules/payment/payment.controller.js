import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { PaymentService } from "./payment.service.js";
import { PAYMENT_MESSAGES } from "./payment.constant.js";
import { PaymentValidation } from "./payment.validation.js";
import Payment from "./payment.model.js";
import { PAYMENT_STATUS } from "./payment.constant.js";
import { NotificationService } from "../notification/notification.service.js";

const initiatePayment = catchAsync(async (req, res) => {
  const result = await PaymentService.initiatePayment(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENT_INITIATED,
    data: result,
  });
});

const paymentSuccess = catchAsync(async (req, res) => {
  const params = { ...req.query, ...req.body };
  const result = await PaymentService.handlePaymentSuccess(params);

  if (result.success) {
    const payment = await Payment.findById(result.paymentId);
    if (payment) {
      await NotificationService.dispatchPaymentSuccess(payment, payment.studentId);
    }
  }

  sendResponse(res, {
    statusCode: result.success ? 200 : 400,
    success: result.success,
    message: result.success ? "Payment verified and completed" : "Payment verification failed",
    data: result,
  });
});

const paymentFail = catchAsync(async (req, res) => {
  const params = { ...req.query, ...req.body };
  const result = await PaymentService.handlePaymentFail(params);

  if (result.paymentId) {
    const payment = await Payment.findById(result.paymentId);
    if (payment) {
      await NotificationService.dispatchPaymentFailed(payment, payment.studentId);
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: false,
    message: "Payment failed",
    data: result,
  });
});

const paymentCancel = catchAsync(async (req, res) => {
  const params = { ...req.query, ...req.body };
  const result = await PaymentService.handlePaymentCancel(params);

  if (result.paymentId) {
    const payment = await Payment.findById(result.paymentId);
    if (payment) {
      await NotificationService.dispatchPaymentFailed(payment, payment.studentId);
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: false,
    message: "Payment cancelled",
    data: result,
  });
});

const paymentIpn = catchAsync(async (req, res) => {
  const params = { ...req.query, ...req.body };
  const result = await PaymentService.handlePaymentIpn(params);

  if (result.success && result.paymentId) {
    const payment = await Payment.findById(result.paymentId);
    if (payment) {
      await NotificationService.dispatchPaymentSuccess(payment, payment.studentId);
    }
  } else if (result.status === PAYMENT_STATUS.FAILED || result.status === PAYMENT_STATUS.CANCELLED) {
    const payment = await Payment.findById(result.paymentId);
    if (payment) {
      await NotificationService.dispatchPaymentFailed(payment, payment.studentId);
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: result.success,
    message: "IPN processed",
    data: result,
  });
});

const getStudentPayments = catchAsync(async (req, res) => {
  const result = await PaymentService.getStudentPayments(req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENTS_FETCHED,
    data: result,
  });
});

const getPayments = catchAsync(async (req, res) => {
  const result = await PaymentService.getPayments(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENTS_FETCHED,
    meta: result.meta,
    data: result.payments,
  });
});

const getPaymentById = catchAsync(async (req, res) => {
  const result = await PaymentService.getPaymentById(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENT_FETCHED,
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIpn,
  getStudentPayments,
  getPayments,
  getPaymentById,
};
