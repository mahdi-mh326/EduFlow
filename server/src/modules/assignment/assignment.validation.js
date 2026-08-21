import { z } from "zod";
import { ASSIGNMENT_STATUS } from "./assignment.constant.js";

const createAssignmentSchema = z.object({
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
    attachmentUrl: z.string().trim().optional(),
    dueDate: z.string().transform((val) => new Date(val)),
    totalMarks: z.number().min(1, "Total marks must be at least 1"),
    status: z.enum(Object.values(ASSIGNMENT_STATUS)).optional(),
  }),
});

const updateAssignmentSchema = z.object({
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
      attachmentUrl: z.string().trim().optional(),
      dueDate: z.string().transform((val) => new Date(val)).optional(),
      totalMarks: z.number().min(1, "Total marks must be at least 1").optional(),
      status: z.enum(Object.values(ASSIGNMENT_STATUS)).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const AssignmentValidation = {
  createAssignmentSchema,
  updateAssignmentSchema,
};
