import { z } from "zod";

const getNotificationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.string().optional(),
});

export const NotificationValidation = { getNotificationsQuerySchema };
