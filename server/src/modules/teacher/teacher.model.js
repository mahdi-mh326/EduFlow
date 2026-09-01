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

    // Legacy optional fields — kept for backward compatibility
    experienceYears: {
      type: Number,
      default: 0,
    },

    bio: {
      type: String,
      default: "",
    },

    officePhone: {
      type: String,
      trim: true,
    },

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
