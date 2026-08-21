import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { ChatbotController } from "./chatbot.controller.js";
import { ChatbotValidation } from "./chatbot.validation.js";
import { CHATBOT_RATE_LIMIT } from "./chatbot.constant.js";
import rateLimit from "express-rate-limit";

const chatbotRateLimiter = rateLimit({
  windowMs: CHATBOT_RATE_LIMIT.WINDOW_MS,
  max: CHATBOT_RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    message: "Too many chatbot requests. Please try again later",
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post("/chat", authenticate, chatbotRateLimiter, validateRequest(ChatbotValidation.chatValidationSchema), ChatbotController.sendChat);

export default router;
