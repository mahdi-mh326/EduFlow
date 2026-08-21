import axios from "axios";
import env from "../../config/env.js";

class AIProvider {
  constructor() {
    this.apiKey = env.aiApiKey || null;
    this.model = env.aiModel || "gpt-3.5-turbo";
    this.baseURL = env.aiBaseURL || "https://api.openai.com/v1";
    this.provider = env.aiProvider || "openai";
    this.timeout = parseInt(env.aiTimeout || "30000", 10);
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async chat(systemPrompt, userMessage, context) {
    if (!this.isConfigured()) {
      throw new Error("AI provider not configured");
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    if (context && context.trim().length > 0) {
      messages[0] = {
        role: "system",
        content: `${systemPrompt}\n\nHere is the relevant EduFlow context to help answer the user's question:\n\n${context}`,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages,
          max_tokens: 500,
          temperature: 0.3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: this.timeout,
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        throw new Error("Empty response from AI provider");
      }

      return { reply, usage: response.data.usage };
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new Error("AI provider timeout");
      }

      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error("Invalid AI API key");
        }
        if (status === 429) {
          throw new Error("AI provider rate limit exceeded");
        }
        if (status >= 500) {
          throw new Error("AI provider server error");
        }
      }

      throw new Error("AI provider error");
    }
  }
}

export const aiProvider = new AIProvider();
export default AIProvider;
