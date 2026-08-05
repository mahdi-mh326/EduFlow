import { z } from "zod";

const createEnrollmentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, "Student is required").optional(),
    courseId: z.string().min(1, "Course is required"),
  }),
});

export const EnrollmentValidation = { createEnrollmentSchema };
