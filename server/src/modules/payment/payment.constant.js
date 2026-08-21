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
  STORE_CREDENTIAL_ERROR: "Store credential error or store is de-active. Verify SSL_STORE_ID and SSL_STORE_PASSWORD in .env and ensure the store is active in the SSLCommerz dashboard.",

  CALLBACK_INVALID: "Invalid payment callback",
  VAL_ID_MISSING: "Missing validation ID in payment callback",
  VALIDATION_FAILED: "Payment validation failed with SSLCommerz",
  AMOUNT_MISMATCH: "Paid amount does not match the order amount",
  CURRENCY_MISMATCH: "Paid currency does not match the order currency",
  TRANSACTION_MISMATCH: "Gateway transaction ID does not match the order",
  STORE_MISMATCH: "Gateway store ID does not match the configured store",
  PAYMENT_NOT_PENDING: "Payment is not in a pending state",
  PAYMENT_ALREADY_PAID: "Payment has already been completed",
};
