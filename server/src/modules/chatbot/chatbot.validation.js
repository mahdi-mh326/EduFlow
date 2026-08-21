import { z } from "zod";
import { CHATBOT_MAX_MESSAGE_LENGTH } from "./chatbot.constant.js";

const chatValidationSchema = z.object({
  body: z.object({
    message: z
      .string()
      .min(1, "Message is required")
      .max(CHATBOT_MAX_MESSAGE_LENGTH, `Message must be at most ${CHATBOT_MAX_MESSAGE_LENGTH} characters`),
  }),
});

const chatHistoryQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().positive("Page must be a positive integer")),

    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().int().positive("Limit must be a positive integer").max(50, "Limit cannot exceed 50")),
  }),
});

export const ChatbotValidation = {
  chatValidationSchema,
  chatHistoryQuerySchema,
};
