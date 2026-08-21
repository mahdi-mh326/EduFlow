import mongoose from "mongoose";
import { QUESTION_TYPE } from "./question.constant.js";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz is required"],
    },
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(QUESTION_TYPE),
      default: QUESTION_TYPE.MCQ,
    },
    options: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      trim: true,
    },
    marks: {
      type: Number,
      required: [true, "Marks is required"],
      min: [1, "Marks must be at least 1"],
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      min: [1, "Order must be at least 1"],
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
    collection: "questions",
  }
);

questionSchema.index({ quizId: 1, order: 1 });

const Question = mongoose.model("Question", questionSchema);
export default Question;
