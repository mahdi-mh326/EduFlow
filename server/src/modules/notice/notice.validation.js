import { z } from "zod";
import { NOTICE_PRIORITY } from "./notice.constant.js";

const createNoticeSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course is required").optional(),
    classId: z.string().min(1, "Class is required").optional(),
    teacherId: z.string().min(1, "Teacher is required"),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .trim(),
    description: z.string().trim().optional(),
    priority: z.enum(Object.values(NOTICE_PRIORITY)).optional(),
    publishDate: z.string().transform((val) => new Date(val)).optional(),
    expiryDate: z.string().transform((val) => new Date(val)).optional(),
  }),
});

const updateNoticeSchema = z.object({
  body: z
    .object({
      courseId: z.string().min(1, "Course is required").optional(),
      classId: z.string().min(1, "Class is required").optional(),
      teacherId: z.string().min(1, "Teacher is required").optional(),
      title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be at most 200 characters")
        .trim()
        .optional(),
      description: z.string().trim().optional(),
      priority: z.enum(Object.values(NOTICE_PRIORITY)).optional(),
      publishDate: z.string().transform((val) => new Date(val)).optional(),
      expiryDate: z.string().transform((val) => new Date(val)).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const NoticeValidation = {
  createNoticeSchema,
  updateNoticeSchema,
};
