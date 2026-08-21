import mongoose from "mongoose";
import { QUIZ_STATUS } from "./quiz.constant.js";

const quizSchema = new mongoose.Schema(
  {
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
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title must be at most 200 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [1, "Total marks must be at least 1"],
    },
    passingMarks: {
      type: Number,
      required: [true, "Passing marks is required"],
      min: [0, "Passing marks cannot be negative"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    attemptLimit: {
      type: Number,
      required: [true, "Attempt limit is required"],
      min: [1, "Attempt limit must be at least 1"],
      max: [10, "Attempt limit cannot exceed 10"],
    },
    status: {
      type: String,
      enum: Object.values(QUIZ_STATUS),
      default: QUIZ_STATUS.DRAFT,
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
    collection: "quizzes",
  }
);

quizSchema.index({ classId: 1, status: 1, createdAt: -1 });
quizSchema.index({ teacherId: 1, createdAt: -1 });
quizSchema.index({ courseId: 1, createdAt: -1 });

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
