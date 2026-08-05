import mongoose from "mongoose";
import { LIVE_SESSION_STATUS } from "./live-session.constant.js";

const liveSessionSchema = new mongoose.Schema(
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
    meetingRoom: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    meetingUrl: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, "Time must be in HH:MM format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, "Time must be in HH:MM format"],
    },
    status: {
      type: String,
      enum: Object.values(LIVE_SESSION_STATUS),
      default: LIVE_SESSION_STATUS.SCHEDULED,
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
    collection: "live_sessions",
  }
);

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
export default LiveSession;
