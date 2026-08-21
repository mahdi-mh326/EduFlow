import mongoose from "mongoose";
import { SUBMISSION_STATUS } from "./submission.constant.js";

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment is required"],
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
    content: {
      type: String,
      default: "",
      trim: true,
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.PENDING,
    },
    marks: {
      type: Number,
      min: [0, "Marks cannot be negative"],
      default: null,
    },
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    collection: "assignment_submissions",
  }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true, sparse: true });
submissionSchema.index({ studentId: 1, createdAt: -1 });
submissionSchema.index({ assignmentId: 1, createdAt: -1 });

const AssignmentSubmission = mongoose.model("AssignmentSubmission", submissionSchema);
export default AssignmentSubmission;
