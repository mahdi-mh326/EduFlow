import { z } from "zod";

export const generateCertificateSchema = z.object({
  body: z.object({
    classId: z.string().min(1, "Class ID is required"),
  }),
});

export const CertificateValidation = {
  generateCertificateSchema,
};
