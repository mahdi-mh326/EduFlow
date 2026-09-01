import env from "../../config/env.js";

class AIProvider {
  constructor() {
    this.apiKey = env.geminiApiKey || env.aiApiKey || null;
    this.model = env.aiModel || "gemini-3.1-flash-lite-preview";
    this.baseURL = env.aiBaseURL || "https://generativelanguage.googleapis.com/v1beta";
    this.provider = env.aiProvider || "gemini";
    this.timeout = parseInt(env.aiTimeout || "30000", 10);
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async chat(systemPrompt, userMessage, context = "", history = []) {
    if (!this.isConfigured()) {
      throw new Error("AI provider not configured");
    }

    // Build system instruction
    let fullSystemPrompt = systemPrompt;
    if (context && context.trim().length > 0) {
      fullSystemPrompt += `\n\n=== RELEVANT EDUFLOW REAL-TIME DATABASE CONTEXT ===\n${context}\n=================================================`;
    }

    // Attempt with primary Gemini model, with fallback list
    const candidateModels = [
      this.model,
      "gemini-3.1-flash-lite-preview",
      "gemini-flash-lite-latest",
      "gemini-2.5-flash-lite",
      "gemini-3-flash-preview",
    ];


    // Remove duplicates
    const uniqueModels = [...new Set(candidateModels)];

    let lastError = null;

    for (const modelName of uniqueModels) {
      try {
        const cleanModelName = modelName.replace(/^models\//, "");

        // Build contents array supporting conversation history
        const contents = [];

        if (Array.isArray(history) && history.length > 0) {
          for (const msg of history.slice(-6)) {
            const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
            if (msg.content && msg.content.trim()) {
              contents.push({
                role,
                parts: [{ text: msg.content.trim() }],
              });
            }
          }
        }

        // Add current user message
        contents.push({
          role: "user",
          parts: [{ text: userMessage.trim() }],
        });

        const requestBody = {
          systemInstruction: {
            parts: [{ text: fullSystemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        };

        const response = await fetch(
          `${this.baseURL}/models/${cleanModelName}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(this.timeout),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const reply = candidate?.content?.parts?.[0]?.text?.trim();

        if (!reply) {
          throw new Error("Empty response returned by Gemini model");
        }

        return {
          reply,
          modelUsed: cleanModelName,
          usage: data.usageMetadata || null,
        };
      } catch (err) {
        lastError = err;
        // Try next candidate model
        continue;
      }
    }

    throw lastError || new Error("Failed to generate response from Gemini");
  }
}

export const aiProvider = new AIProvider();
export default AIProvider;

