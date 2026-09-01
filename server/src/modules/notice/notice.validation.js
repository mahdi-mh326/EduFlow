import { z } from "zod";
import { NOTICE_PRIORITY, NOTICE_TARGET_AUDIENCE } from "./notice.constant.js";

const createNoticeSchema = z.object({
  body: z.object({
    courseId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
    teacherId: z.string().optional().nullable(),
    targetAudience: z.enum(Object.values(NOTICE_TARGET_AUDIENCE)).optional(),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .trim(),
    description: z.string().trim().optional().default(""),
    attachmentUrl: z.string().trim().optional().default(""),
    isPinned: z.boolean().optional().default(false),
    priority: z.enum(Object.values(NOTICE_PRIORITY)).optional(),
    publishDate: z.string().transform((val) => new Date(val)).optional(),
    expiryDate: z.string().transform((val) => new Date(val)).optional(),
  }),
});

const updateNoticeSchema = z.object({
  body: z
    .object({
      courseId: z.string().optional().nullable(),
      classId: z.string().optional().nullable(),
      teacherId: z.string().optional().nullable(),
      targetAudience: z.enum(Object.values(NOTICE_TARGET_AUDIENCE)).optional(),
      title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be at most 200 characters")
        .trim()
        .optional(),
      description: z.string().trim().optional(),
      attachmentUrl: z.string().trim().optional(),
      isPinned: z.boolean().optional(),
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
