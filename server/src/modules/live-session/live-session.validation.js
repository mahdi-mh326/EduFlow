import { z } from "zod";
import { LIVE_SESSION_STATUS } from "./live-session.constant.js";

const createLiveSessionSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course is required"),
    classId: z.string().min(1, "Class is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .trim(),
    description: z.string().trim().optional(),
    scheduledDate: z.string().transform((val) => new Date(val)),
    startTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, "Start time must be in HH:MM format"),
    endTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, "End time must be in HH:MM format"),
    status: z.enum(Object.values(LIVE_SESSION_STATUS)).optional(),
  }),
});

const updateLiveSessionSchema = z.object({
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
      scheduledDate: z.string().transform((val) => new Date(val)).optional(),
      startTime: z
        .string()
        .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, "Start time must be in HH:MM format")
        .optional(),
      endTime: z
        .string()
        .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, "End time must be in HH:MM format")
        .optional(),
      status: z.enum(Object.values(LIVE_SESSION_STATUS)).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const LiveSessionValidation = {
  createLiveSessionSchema,
  updateLiveSessionSchema,
};
