import { z } from "zod";
import { MATERIAL_VISIBILITY } from "./material.constant.js";

const createMaterialSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course is required"),
    classId: z.string().min(1, "Class is required"),
    teacherId: z.string().min(1, "Teacher is required").optional(),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .trim(),
    description: z.string().trim().optional(),
    fileUrl: z.string().min(1, "File URL is required"),
    fileType: z.string().min(1, "File type is required"),
    visibility: z.enum(Object.values(MATERIAL_VISIBILITY)).optional(),
  }),
});

const updateMaterialSchema = z.object({
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
      fileUrl: z.string().min(1, "File URL is required").optional(),
      fileType: z.string().min(1, "File type is required").optional(),
      visibility: z.enum(Object.values(MATERIAL_VISIBILITY)).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const MaterialValidation = {
  createMaterialSchema,
  updateMaterialSchema,
};
