export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export const PAYMENT_GATEWAY = {
  SSLCOMMERZ: "sslcommerz",
};

export const PAYMENT_MESSAGES = {
  PAYMENT_INITIATED: "Payment session created",
  PAYMENT_FETCHED: "Payment fetched successfully",
  PAYMENTS_FETCHED: "Payments fetched successfully",
  PAYMENT_NOT_FOUND: "Payment not found",
  ALREADY_ENROLLED: "Student is already enrolled in this course",
  ALREADY_PAID: "Payment already completed for this course",
  DRAFT_COURSE: "Course is not published",
  DELETED_COURSE: "Course is not available",
  INVALID_AMOUNT: "Invalid payment amount",
  INVALID_SSL_RESPONSE: "Invalid response from payment gateway",
};
