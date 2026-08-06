import mongoose from "mongoose";
import { PAYMENT_STATUS, PAYMENT_GATEWAY } from "./payment.constant.js";

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "BDT",
      uppercase: true,
      trim: true,
    },
    gateway: {
      type: String,
      enum: Object.values(PAYMENT_GATEWAY),
      default: PAYMENT_GATEWAY.SSLCOMMERZ,
    },
    transactionId: {
      type: String,
      unique: true,
      trim: true,
    },
    bankTransactionId: {
      type: String,
      trim: true,
    },
    valId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    sslSessionKey: {
      type: String,
      trim: true,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    paidAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
