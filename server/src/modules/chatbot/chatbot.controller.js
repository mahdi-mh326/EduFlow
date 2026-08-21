import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { ChatbotService } from "./chatbot.service.js";
import { AIService } from "../../shared/ai/ai.service.js";
import { CHATBOT_MESSAGES, CHATBOT_STATUS_CODES } from "./chatbot.constant.js";

const sendChat = catchAsync(async (req, res) => {
  const user = req.user;
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return sendResponse(res, {
      statusCode: CHATBOT_STATUS_CODES.BAD_REQUEST,
      success: false,
      message: CHATBOT_MESSAGES.INVALID_MESSAGE,
      data: null,
    });
  }

  const queryDomain = ChatbotService.detectQueryDomain(message);
  const context = await ChatbotService.retrieveAuthorizedContext(user._id, user.role, queryDomain);
  const formattedContext = ChatbotService.formatContextForAI(context);

  const aiResult = await AIService.generateReply(ChatbotService.SYSTEM_PROMPT, message, formattedContext);
  const sources = ChatbotService.getSourcesFromContext(context);

  sendResponse(res, {
    statusCode: CHATBOT_STATUS_CODES.SUCCESS,
    success: true,
    message: "Chatbot response generated successfully",
    data: {
      reply: aiResult.reply,
      sources,
      queryDomain,
    },
  });
});

export const ChatbotController = {
  sendChat,
};
