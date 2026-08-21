import { z } from "zod";
import { SUBMISSION_STATUS } from "./submission.constant.js";

const createSubmissionSchema = z.object({
  body: z.object({
    content: z.string().trim().optional(),
    attachmentUrl: z.string().trim().optional(),
  }),
});

const updateSubmissionSchema = z.object({
  body: z
    .object({
      content: z.string().trim().optional(),
      attachmentUrl: z.string().trim().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const SubmissionValidation = {
  createSubmissionSchema,
  updateSubmissionSchema,
};
