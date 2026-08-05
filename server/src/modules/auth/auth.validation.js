import { z } from "zod";

const registerValidationSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters")
      .max(100),

    email: z
      .string()
      .email("Invalid email address")
      .transform((value) => value.toLowerCase()),

    phone: z
      .string()
      .min(11, "Phone must be at least 11 digits")
      .max(15, "Phone must be at most 15 digits"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    gender: z
      .enum(["male", "female", "other"])
      .optional(),

    dateOfBirth: z
      .string()
      .optional(),
  }),
});

const verifyEmailValidationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .transform((value) => value.toLowerCase()),

    otp: z
      .string()
      .length(6, "OTP must be 6 digits"),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});

const resendOTPValidationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .transform((value) => value.toLowerCase()),
  }),
});

const setPasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(6, "Current password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});

const sendVerificationOTPValidationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .transform((value) => value.toLowerCase()),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  verifyEmailValidationSchema,
  loginValidationSchema,
  resendOTPValidationSchema,
  setPasswordValidationSchema,
  sendVerificationOTPValidationSchema,
};
