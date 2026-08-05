import { z } from "zod";

const E164 = /^\+[1-9]\d{7,14}$/;

const createTeacherSchema = z.object({
  body: z.object({
    // User fields
    fullName: z
      .string({ error: (i) => i.input === undefined ? "Full name is required." : "Full name must be a string." })
      .min(3, "Full name must be at least 3 characters.")
      .max(100, "Full name must be at most 100 characters.")
      .trim(),

    email: z
      .string({ error: (i) => i.input === undefined ? "Email is required." : "Email must be a string." })
      .email("Invalid email address.")
      .transform((v) => v.toLowerCase()),

    phone: z
      .string({ error: (i) => i.input === undefined ? "Phone number is required." : "Phone number must be a string." })
      .regex(E164, "Invalid phone number. Use E.164 format (e.g. +8801XXXXXXXXX)."),

    gender: z.enum(["male", "female", "other"], {
      error: (i) => i.input === undefined ? "Gender is required." : "Gender must be male, female, or other.",
    }),

    avatar: z.string().url("Avatar must be a valid URL.").optional(),

    // Profile fields
    designation: z
      .string({ error: (i) => i.input === undefined ? "Designation is required." : "Designation must be a string." })
      .min(2, "Designation must be at least 2 characters.")
      .trim(),

    qualification: z
      .string({ error: (i) => i.input === undefined ? "Qualification is required." : "Qualification must be a string." })
      .min(2, "Qualification must be at least 2 characters.")
      .trim(),

    experienceYears: z
      .number({ error: (i) => i.input === undefined ? "Experience years is required." : "Experience must be a non-negative integer." })
      .int("Experience must be a non-negative integer.")
      .min(0, "Experience must be a non-negative integer."),

    bio: z.string().optional(),

    officePhone: z
      .string()
      .regex(E164, "Invalid office phone. Use E.164 format (e.g. +8801XXXXXXXXX).")
      .optional(),
  }),
});

const updateTeacherSchema = z.object({
  body: z
    .object({
      // User fields
      fullName: z
        .string()
        .min(3, "Full name must be at least 3 characters.")
        .max(100, "Full name must be at most 100 characters.")
        .trim()
        .optional(),

      phone: z
        .string()
        .regex(E164, "Invalid phone number. Use E.164 format (e.g. +8801XXXXXXXXX).")
        .optional(),

      gender: z.enum(["male", "female", "other"]).optional(),

      avatar: z.string().url("Avatar must be a valid URL.").optional(),

      // Profile fields
      designation: z
        .string()
        .min(2, "Designation must be at least 2 characters.")
        .trim()
        .optional(),

      qualification: z
        .string()
        .min(2, "Qualification must be at least 2 characters.")
        .trim()
        .optional(),

      experienceYears: z
        .number({ error: () => "Experience must be a non-negative integer." })
        .int("Experience must be a non-negative integer.")
        .min(0, "Experience must be a non-negative integer.")
        .optional(),

      bio: z.string().optional(),

      officePhone: z
        .string()
        .regex(E164, "Invalid office phone. Use E.164 format (e.g. +8801XXXXXXXXX).")
        .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const updateTeacherStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "blocked"], {
      error: (i) => i.input === undefined ? "Status is required." : "Status must be either 'active' or 'blocked'.",
    }),
  }),
});

export const TeacherValidation = { createTeacherSchema, updateTeacherSchema, updateTeacherStatusSchema };
