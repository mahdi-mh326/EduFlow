import { z } from "zod";
import { CLASS_DAYS, CLASS_STATUS } from "./class.constant.js";

const createClassSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    batchName: z
      .string()
      .min(1, "Batch name is required")
      .max(100, "Batch name must be at most 100 characters")
      .trim(),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    classDays: z
      .array(z.enum(Object.values(CLASS_DAYS)))
      .min(1, "At least one class day is required"),
    startTime: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
        "Start time must be in HH:MM format"
      ),
    endTime: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
        "End time must be in HH:MM format"
      ),
    status: z.enum(Object.values(CLASS_STATUS)).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  }),
});

const updateClassSchema = z.object({
  body: z
    .object({
      courseId: z.string().min(1, "Course is required").optional(),
      teacherId: z.string().min(1, "Teacher is required").optional(),
      batchName: z
        .string()
        .min(1, "Batch name is required")
        .max(100, "Batch name must be at most 100 characters")
        .trim()
        .optional(),
      startDate: z
        .string()
        .transform((val) => new Date(val))
        .optional(),
      endDate: z
        .string()
        .transform((val) => new Date(val))
        .optional(),
      classDays: z
        .array(z.enum(Object.values(CLASS_DAYS)))
        .min(1, "At least one class day is required")
        .optional(),
      startTime: z
        .string()
        .regex(
          /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
          "Start time must be in HH:MM format"
        )
        .optional(),
      endTime: z
        .string()
        .regex(
          /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
          "End time must be in HH:MM format"
        )
        .optional(),
      status: z.enum(Object.values(CLASS_STATUS)).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.endDate > data.startDate;
        }
        return true;
      },
      {
        message: "End date must be after start date",
        path: ["endDate"],
      }
    )
    .refine(
      (data) => {
        if (data.startTime && data.endTime) {
          return data.endTime > data.startTime;
        }
        return true;
      },
      {
        message: "End time must be after start time",
        path: ["endTime"],
      }
    ),
});

export const ClassValidation = { createClassSchema, updateClassSchema };
