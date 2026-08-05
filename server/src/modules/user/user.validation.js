import { z } from "zod";

const e164Phone = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone number must be in international E.164 format.");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD.")
  .refine((val) => !isNaN(Date.parse(val)), "Invalid date.");

const createUserValidationSchema = z.object({
  body: z.object({
    fullName: z
      .string({ error: (i) => i.input === undefined ? "Full name is required." : "Full name must be a string." })
      .min(3, "Full name must be at least 3 characters.")
      .max(100, "Full name must be at most 100 characters."),

    email: z
      .string({ error: (i) => i.input === undefined ? "Email is required." : "Email must be a string." })
      .email("Invalid email address.")
      .toLowerCase(),

    phone: e164Phone,

    password: z
      .string({ error: (i) => i.input === undefined ? "Password is required." : "Password must be a string." })
      .min(6, "Password must be at least 6 characters."),

    gender: z.enum(["male", "female", "other"]).optional(),

    dateOfBirth: isoDate.optional(),
  }),
});

const updateProfileValidationSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(3, "Full name must be at least 3 characters.").max(100).optional(),
      phone: e164Phone.optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      avatar: z.string().url("Invalid avatar URL.").optional(),
      dateOfBirth: isoDate.optional(),
    })
    .refine(
      (data) => Object.values(data).some((v) => v !== undefined),
      { message: "At least one field must be provided for update." }
    ),
});

const changePasswordValidationSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required."),
      newPassword: z.string().min(6, "New password must be at least 6 characters."),
      confirmPassword: z.string().min(1, "Confirm password is required."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidationSchema,
};
