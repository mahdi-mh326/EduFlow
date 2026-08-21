import mongoose from "mongoose";
import { ATTEMPT_STATUS } from "./attempt.constant.js";

const attemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz is required"],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: false,
    },
    attemptNumber: {
      type: Number,
      required: [true, "Attempt number is required"],
      min: [1, "Attempt number must be at least 1"],
    },
    startedAt: {
      type: Date,
      required: [true, "Start time is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry time is required"],
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ATTEMPT_STATUS),
      default: ATTEMPT_STATUS.IN_PROGRESS,
    },
    score: {
      type: Number,
      min: [0, "Score cannot be negative"],
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [1, "Total marks must be at least 1"],
    },
    percentage: {
      type: Number,
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
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
    collection: "quiz_attempts",
  }
);

attemptSchema.index({ quizId: 1, studentId: 1, attemptNumber: 1 }, { unique: true, sparse: true });
attemptSchema.index({ studentId: 1, createdAt: -1 });
attemptSchema.index({ quizId: 1, status: 1, createdAt: -1 });

const QuizAttempt = mongoose.model("QuizAttempt", attemptSchema);
export default QuizAttempt;
