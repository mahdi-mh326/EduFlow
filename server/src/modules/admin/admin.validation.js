import { z } from "zod";

const E164 = /^\+[1-9]\d{7,14}$/;

const createAdminSchema = z.object({
  body: z.object({
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

    gender: z.enum(["male", "female", "other"]).optional(),
  }),
});

export const AdminValidation = { createAdminSchema };
