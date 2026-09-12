import { z } from "zod";
import { MATERIAL_VISIBILITY } from "./material.constant.js";

const createMaterialSchema = z.object({
  body: z.object({
    courseId: z.string().optional().or(z.literal("")),
    classId: z.string().min(1, "Class is required"),
    teacherId: z.string().optional().or(z.literal("")),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .trim(),
    description: z.string().trim().optional().or(z.literal("")),
    fileUrl: z.string().min(1, "File URL is required"),
    fileType: z.string().optional().or(z.literal("")),
    visibility: z.enum(Object.values(MATERIAL_VISIBILITY)).optional().or(z.literal("")),
  }),
});

const updateMaterialSchema = z.object({
  body: z
    .object({
      courseId: z.string().optional().or(z.literal("")),
      classId: z.string().optional().or(z.literal("")),
      teacherId: z.string().optional().or(z.literal("")),
      title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be at most 200 characters")
        .trim()
        .optional(),
      description: z.string().trim().optional().or(z.literal("")),
      fileUrl: z.string().min(1, "File URL is required").optional(),
      fileType: z.string().optional().or(z.literal("")),
      visibility: z.enum(Object.values(MATERIAL_VISIBILITY)).optional().or(z.literal("")),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const MaterialValidation = {
  createMaterialSchema,
  updateMaterialSchema,
};
