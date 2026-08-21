import { z } from "zod";
import { QUESTION_TYPE } from "./question.constant.js";

const createQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(1, "Question text is required").trim(),
    type: z.enum(Object.values(QUESTION_TYPE)).optional(),
    options: z
      .array(
        z.object({
          key: z.string().min(1, "Option key is required"),
          text: z.string().min(1, "Option text is required"),
        })
      )
      .min(2, "At least 2 options are required"),
    correctAnswer: z.string().min(1, "Correct answer is required"),
    marks: z.number().min(1, "Marks must be at least 1"),
    order: z.number().min(1, "Order must be at least 1"),
  }),
});

const updateQuestionSchema = z.object({
  body: z
    .object({
      questionText: z.string().min(1, "Question text is required").trim().optional(),
      type: z.enum(Object.values(QUESTION_TYPE)).optional(),
      options: z
        .array(
          z.object({
            key: z.string().min(1, "Option key is required"),
            text: z.string().min(1, "Option text is required"),
          })
        )
        .min(2, "At least 2 options are required")
        .optional(),
      correctAnswer: z.string().min(1, "Correct answer is required").optional(),
      marks: z.number().min(1, "Marks must be at least 1").optional(),
      order: z.number().min(1, "Order must be at least 1").optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const QuestionValidation = {
  createQuestionSchema,
  updateQuestionSchema,
};
