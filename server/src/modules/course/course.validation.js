import { z } from "zod";
import { COURSE_DIFFICULTY, COURSE_STATUS, COURSE_DURATION_UNIT, COURSE_CATEGORY } from "./course.constant.js";

const createCourseSchema = z.object({
  body: z.object({
    title: z
      .string({ error: (i) => i.input === undefined ? "Title is required." : "Title must be a string." })
      .min(3, "Title must be at least 3 characters.")
      .max(150, "Title must be at most 150 characters.")
      .trim(),

    shortDescription: z
      .string({ error: (i) => i.input === undefined ? "Short description is required." : "Short description must be a string." })
      .min(10, "Short description must be at least 10 characters.")
      .max(300, "Short description must be at most 300 characters.")
      .trim(),

    description: z
      .string({ error: (i) => i.input === undefined ? "Description is required." : "Description must be a string." })
      .min(20, "Description must be at least 20 characters."),

    price: z
      .number({ error: (i) => i.input === undefined ? "Price is required." : "Price must be a number." })
      .min(0, "Price cannot be negative."),

    offerPrice: z
      .number({ error: () => "Offer price must be a number." })
      .min(0, "Offer price cannot be negative.")
      .optional(),

    durationValue: z
      .number({ error: (i) => i.input === undefined ? "Duration value is required." : "Duration value must be a number." })
      .int("Duration value must be a whole number.")
      .min(1, "Duration value must be at least 1."),

    durationUnit: z.enum(Object.values(COURSE_DURATION_UNIT), {
      error: (i) => i.input === undefined
        ? "Duration unit is required."
        : `Duration unit must be one of: ${Object.values(COURSE_DURATION_UNIT).join(", ")}.`,
    }),

    category: z.enum(Object.values(COURSE_CATEGORY), {
      error: (i) => i.input === undefined
        ? "Category is required."
        : `Category must be one of: ${Object.values(COURSE_CATEGORY).join(", ")}.`,
    }),

    difficulty: z.enum(Object.values(COURSE_DIFFICULTY), {
      error: (i) => i.input === undefined
        ? "Difficulty is required."
        : `Difficulty must be one of: ${Object.values(COURSE_DIFFICULTY).join(", ")}.`,
    }),

    thumbnail: z.string().url("Thumbnail must be a valid URL.").optional(),

    banner: z.string().url("Banner must be a valid URL.").optional(),

    featured: z.boolean().optional(),
  })
  .refine(
    (data) => data.offerPrice == null || data.offerPrice <= data.price,
    { message: "Offer price must not exceed the original price.", path: ["offerPrice"] }
  ),
});

const updateCourseSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(3, "Title must be at least 3 characters.")
        .max(150, "Title must be at most 150 characters.")
        .trim()
        .optional(),

      shortDescription: z
        .string()
        .min(10, "Short description must be at least 10 characters.")
        .max(300, "Short description must be at most 300 characters.")
        .trim()
        .optional(),

      description: z
        .string()
        .min(20, "Description must be at least 20 characters.")
        .optional(),

      price: z
        .number({ error: () => "Price must be a number." })
        .min(0, "Price cannot be negative.")
        .optional(),

      offerPrice: z
        .number({ error: () => "Offer price must be a number." })
        .min(0, "Offer price cannot be negative.")
        .optional(),

      durationValue: z
        .number({ error: () => "Duration value must be a number." })
        .int("Duration value must be a whole number.")
        .min(1, "Duration value must be at least 1.")
        .optional(),

      durationUnit: z
        .enum(Object.values(COURSE_DURATION_UNIT), {
          error: () => `Duration unit must be one of: ${Object.values(COURSE_DURATION_UNIT).join(", ")}.`,
        })
        .optional(),

      category: z
        .enum(Object.values(COURSE_CATEGORY), {
          error: () => `Category must be one of: ${Object.values(COURSE_CATEGORY).join(", ")}.`,
        })
        .optional(),

      difficulty: z
        .enum(Object.values(COURSE_DIFFICULTY), {
          error: () => `Difficulty must be one of: ${Object.values(COURSE_DIFFICULTY).join(", ")}.`,
        })
        .optional(),

      thumbnail: z.string().url("Thumbnail must be a valid URL.").optional(),

      banner: z.string().url("Banner must be a valid URL.").optional(),

      featured: z.boolean().optional(),

      status: z
        .enum(Object.values(COURSE_STATUS), {
          error: () => `Status must be one of: ${Object.values(COURSE_STATUS).join(", ")}.`,
        })
        .optional(),

      timelineVisible: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    })
    .refine(
      (data) => data.offerPrice == null || data.price == null || data.offerPrice <= data.price,
      { message: "Offer price must not exceed the original price.", path: ["offerPrice"] }
    ),
});

export const CourseValidation = { createCourseSchema, updateCourseSchema };
