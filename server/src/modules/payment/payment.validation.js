import { z } from "zod";

const initiatePaymentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course is required"),
    classId: z.string().optional(),
  }),

});

export const PaymentValidation = { initiatePaymentSchema };
