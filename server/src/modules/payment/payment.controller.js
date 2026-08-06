import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { PaymentService } from "./payment.service.js";
import { PAYMENT_MESSAGES } from "./payment.constant.js";
import { PaymentValidation } from "./payment.validation.js";

const initiatePayment = catchAsync(async (req, res) => {
  const result = await PaymentService.initiatePayment(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENT_INITIATED,
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
  getStudentPayments,
  getPayments,
  getPaymentById,
};
