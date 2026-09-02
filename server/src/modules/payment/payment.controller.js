import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { PaymentService } from "./payment.service.js";
import { PAYMENT_MESSAGES } from "./payment.constant.js";
import { PaymentValidation } from "./payment.validation.js";
import Payment from "./payment.model.js";
import { PAYMENT_STATUS } from "./payment.constant.js";
import { NotificationService } from "../notification/notification.service.js";
import { USER_ROLE } from "../user/user.constant.js";
import ApiError from "../../shared/ApiError.js";
import logger from "../../shared/logger.js";

const getClientUrl = () => {
  const isProd =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.PORT && process.env.PORT !== "5000");

  let clientUrl = process.env.CLIENT_URL;
  if (!clientUrl || (isProd && clientUrl.includes("localhost"))) {
    return "https://mahdi-edu-flow.vercel.app";
  }
  return clientUrl.replace(/\/$/, "");
};

const initiatePayment = catchAsync(async (req, res) => {
  const result = await PaymentService.initiatePayment(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENT_INITIATED,
    data: result,
  });
});

const paymentSuccess = async (req, res) => {
  const params = { ...req.query, ...req.body };
  const clientUrl = getClientUrl();
  const tranId = params.tran_id || "";

  try {
    const result = await PaymentService.handlePaymentSuccess(params);

    if (result.success) {
      const payment = await Payment.findById(result.paymentId);
      if (payment) {
        try {
          await NotificationService.dispatchPaymentSuccess(payment, payment.studentId);
        } catch (notifErr) {
          logger.warn(`[Payment] Notification dispatch error: ${notifErr.message}`);
        }
      }
    }

    const paymentId = result.paymentId || params.val_id || "";
    return res.redirect(
      `${clientUrl}/payment/result?status=${result.success ? "success" : "failed"}&tran_id=${encodeURIComponent(tranId)}&payment_id=${encodeURIComponent(paymentId)}`
    );
  } catch (error) {
    logger.error(`[PaymentController] Payment success handling failed: ${error.message}`);
    return res.redirect(
      `${clientUrl}/payment/result?status=failed&tran_id=${encodeURIComponent(tranId)}&message=${encodeURIComponent(error.message || "Payment verification failed")}`
    );
  }
};

const paymentFail = async (req, res) => {
  const params = { ...req.query, ...req.body };
  const clientUrl = getClientUrl();
  const tranId = params.tran_id || "";

  try {
    const result = await PaymentService.handlePaymentFail(params);

    if (result.paymentId) {
      const payment = await Payment.findById(result.paymentId);
      if (payment) {
        try {
          await NotificationService.dispatchPaymentFailed(payment, payment.studentId);
        } catch (notifErr) {
          logger.warn(`[Payment] Fail notification error: ${notifErr.message}`);
        }
      }
    }
  } catch (error) {
    logger.warn(`[PaymentController] Fail callback error: ${error.message}`);
  }

  return res.redirect(
    `${clientUrl}/payment/result?status=failed&tran_id=${encodeURIComponent(tranId)}`
  );
};

const paymentCancel = async (req, res) => {
  const params = { ...req.query, ...req.body };
  const clientUrl = getClientUrl();
  const tranId = params.tran_id || "";

  try {
    const result = await PaymentService.handlePaymentCancel(params);

    if (result.paymentId) {
      const payment = await Payment.findById(result.paymentId);
      if (payment) {
        try {
          await NotificationService.dispatchPaymentFailed(payment, payment.studentId);
        } catch (notifErr) {
          logger.warn(`[Payment] Cancel notification error: ${notifErr.message}`);
        }
      }
    }
  } catch (error) {
    logger.warn(`[PaymentController] Cancel callback error: ${error.message}`);
  }

  return res.redirect(
    `${clientUrl}/payment/result?status=cancelled&tran_id=${encodeURIComponent(tranId)}`
  );
};

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

  if (req.user.role === USER_ROLE.STUDENT && result.studentId?._id?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only view your own payment details");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENT_FETCHED,
    data: result,
  });
});

const getPaymentByTransactionId = catchAsync(async (req, res) => {
  const result = await PaymentService.getPaymentByTranId(req.params.tranId, req.user._id, req.user.role);

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
  getPaymentByTransactionId,
};

