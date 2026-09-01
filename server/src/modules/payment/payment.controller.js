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

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const tranId = result.transactionId || params.tran_id || "";
  const paymentId = result.paymentId || params.val_id || "";

  return res.redirect(
    `${clientUrl}/payment/result?status=${result.success ? "success" : "failed"}&tran_id=${encodeURIComponent(tranId)}&payment_id=${encodeURIComponent(paymentId)}`
  );
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

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const tranId = result.transactionId || params.tran_id || "";

  return res.redirect(
    `${clientUrl}/payment/result?status=failed&tran_id=${encodeURIComponent(tranId)}`
  );
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

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const tranId = result.transactionId || params.tran_id || "";

  return res.redirect(
    `${clientUrl}/payment/result?status=cancelled&tran_id=${encodeURIComponent(tranId)}`
  );
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
