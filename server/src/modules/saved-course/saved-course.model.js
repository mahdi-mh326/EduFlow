import mongoose from "mongoose";

const savedCourseSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    isNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

savedCourseSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const SavedCourse = mongoose.model("SavedCourse", savedCourseSchema);

export default SavedCourse;
