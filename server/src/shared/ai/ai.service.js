import { aiProvider } from "./ai.provider.js";
import { CHATBOT_MESSAGES } from "../../modules/chatbot/chatbot.constant.js";

const generateReply = async (systemPrompt, userMessage, context = "", history = []) => {
  if (!aiProvider.isConfigured()) {
    return {
      reply: CHATBOT_MESSAGES.AI_PROVIDER_UNAVAILABLE,
      configured: false,
    };
  }

  try {
    const result = await aiProvider.chat(systemPrompt, userMessage, context, history);
    return {
      reply: result.reply,
      configured: true,
      modelUsed: result.modelUsed,
    };
  } catch (error) {
    return {
      reply: CHATBOT_MESSAGES.PROVIDER_ERROR,
      configured: true,
      error: error.message,
    };
  }
};


export const AIService = {
  generateReply,
};

export default AIService;
