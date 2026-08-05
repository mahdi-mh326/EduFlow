import mongoose from "mongoose";
import { COURSE_DIFFICULTY, COURSE_STATUS, COURSE_DURATION_UNIT, COURSE_CATEGORY } from "./course.constant.js";

const toSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: [150, "Title must be at most 150 characters."],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    banner: {
      type: String,
      default: "",
    },

    shortDescription: {
      type: String,
      required: true,
      maxlength: [300, "Short description must be at most 300 characters."],
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative."],
    },

    offerPrice: {
      type: Number,
      min: [0, "Offer price cannot be negative."],
    },

    // Structured duration: value + unit (e.g. 3 months, 2 weeks)
    durationValue: {
      type: Number,
      required: true,
      min: [1, "Duration value must be at least 1."],
    },

    durationUnit: {
      type: String,
      enum: Object.values(COURSE_DURATION_UNIT),
      required: true,
    },

    category: {
      type: String,
      enum: Object.values(COURSE_CATEGORY),
      required: true,
    },

    difficulty: {
      type: String,
      enum: Object.values(COURSE_DIFFICULTY),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      default: COURSE_STATUS.DRAFT,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    timelineVisible: {
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
    collection: "courses",
  }
);

courseSchema.pre("validate", function () {
  if (this.isModified("title") || this.isNew) {
    this.slug = toSlug(this.title);
  }
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
