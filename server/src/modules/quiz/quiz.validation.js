import { z } from "zod";
import { QUIZ_STATUS } from "./quiz.constant.js";

const createQuizSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course is required"),
    classId: z.string().min(1, "Class is required"),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .trim(),
    description: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
    durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
    totalMarks: z.number().min(1, "Total marks must be at least 1"),
    passingMarks: z.number().min(0, "Passing marks cannot be negative"),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    attemptLimit: z.number().min(1, "Attempt limit must be at least 1").max(10, "Attempt limit cannot exceed 10"),
    status: z.enum(Object.values(QUIZ_STATUS)).optional(),
  }),
});

const updateQuizSchema = z.object({
  body: z
    .object({
      courseId: z.string().min(1, "Course is required").optional(),
      classId: z.string().min(1, "Class is required").optional(),
      title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be at most 200 characters")
        .trim()
        .optional(),
      description: z.string().trim().optional(),
      instructions: z.string().trim().optional(),
      durationMinutes: z.number().min(1, "Duration must be at least 1 minute").optional(),
      totalMarks: z.number().min(1, "Total marks must be at least 1").optional(),
      passingMarks: z.number().min(0, "Passing marks cannot be negative").optional(),
      startDate: z.string().transform((val) => new Date(val)).optional(),
      endDate: z.string().transform((val) => new Date(val)).optional(),
      attemptLimit: z.number().min(1, "Attempt limit must be at least 1").max(10, "Attempt limit cannot exceed 10").optional(),
      status: z.enum(Object.values(QUIZ_STATUS)).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const QuizValidation = {
  createQuizSchema,
  updateQuizSchema,
};
