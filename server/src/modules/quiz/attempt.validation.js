import { z } from "zod";

const startAttemptSchema = z.object({
  body: z.object({}),
});

const submitAttemptSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().min(1, "Question ID is required"),
        selectedOption: z.string().min(1, "Selected option is required"),
      })
    ).min(1, "At least one answer is required"),
  }),
});

export const AttemptValidation = {
  startAttemptSchema,
  submitAttemptSchema,
};
