import mongoose from "mongoose";
import { NOTICE_PRIORITY, NOTICE_TARGET_AUDIENCE } from "./notice.constant.js";

const noticeSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    targetAudience: {
      type: String,
      enum: Object.values(NOTICE_TARGET_AUDIENCE),
      default: NOTICE_TARGET_AUDIENCE.ALL,
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
    attachmentUrl: {
      type: String,
      default: "",
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: Object.values(NOTICE_PRIORITY),
      default: NOTICE_PRIORITY.MEDIUM,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
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
    collection: "notices",
  }
);

const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;
