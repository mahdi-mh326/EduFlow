export const CHATBOT_MESSAGES = {
  AI_PROVIDER_UNAVAILABLE: "The EduFlow AI assistant is temporarily unavailable. Please try again later.",
  INVALID_MESSAGE: "Message must be a non-empty string",
  MESSAGE_TOO_LONG: "Message is too long. Maximum 2000 characters allowed",
  RATE_LIMIT_EXCEEDED: "Too many chatbot requests. Please try again later",
  NO_CONTEXT_FOUND: "I couldn't find that information in your EduFlow account.",
  PROVIDER_ERROR: "The EduFlow AI assistant is temporarily unavailable. Please try again later.",
  PROVIDER_TIMEOUT: "The request timed out. Please try again later.",
};

export const CHATBOT_STATUS_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const CHATBOT_CONTEXT_LIMITS = {
  ASSIGNMENTS: 10,
  QUIZZES: 10,
  LIVE_SESSIONS: 5,
  NOTICES: 10,
  MATERIALS: 10,
  NOTIFICATIONS: 5,
  ATTENDANCE: 10,
  ENROLLMENTS: 20,
};

export const CHATBOT_RATE_LIMIT = {
  WINDOW_MS: 60 * 1000,
  MAX_REQUESTS: 30,
};

export const CHATBOT_MAX_MESSAGE_LENGTH = 2000;
