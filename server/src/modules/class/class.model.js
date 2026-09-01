import mongoose from "mongoose";
import { CLASS_STATUS, CLASS_DAYS } from "./class.constant.js";

const classSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    batchName: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
      maxlength: [100, "Batch name must be at most 100 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    classDays: [
      {
        type: String,
        enum: Object.values(CLASS_DAYS),
        required: true,
      },
    ],
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
        "Time must be in HH:MM format",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
        "Time must be in HH:MM format",
      ],
    },
    status: {
      type: String,
      enum: Object.values(CLASS_STATUS),
      default: CLASS_STATUS.UPCOMING,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    capacity: {
      type: Number,
      default: 50,
      min: [1, "Capacity must be at least 1"],
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: [0, "Current students cannot be negative"],
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
    collection: "classes",
  }
);

const Class = mongoose.model("Class", classSchema);

export default Class;

