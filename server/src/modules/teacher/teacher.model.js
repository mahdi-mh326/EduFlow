import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },

    // Required profile fields
    designation: {
      type: String,
      required: true,
      trim: true,
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    experienceYears: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Experience years cannot be negative."],
    },

    // Optional profile fields
    bio: {
      type: String,
      default: "",
    },

    officePhone: {
      type: String,
      match: [/^\+[1-9]\d{7,14}$/, "Invalid office phone. Use E.164 format."],
      trim: true,
    },

    // Legacy optional fields — kept for backward compatibility, never required
    department: {
      type: String,
      trim: true,
    },

    joiningDate: {
      type: Date,
    },

    specialization: {
      type: String,
      trim: true,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "teacher_profiles",
  }
);

const TeacherProfile = mongoose.model("TeacherProfile", teacherProfileSchema);

export default TeacherProfile;
