import { z } from "zod";

const createUserValidationSchema = z.object({
  body: z.object({
    fullName: z
      .string({
        required_error: "Full name is required",
      })
      .min(3, "Full name must be at least 3 characters")
      .max(100),

    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email address")
      .toLowerCase(),

    phone: z
      .string({
        required_error: "Phone number is required",
      })
      .min(11)
      .max(15),

    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters"),

    gender: z
      .enum(["male", "female", "other"])
      .optional(),

    dateOfBirth: z
      .string()
      .optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
};