import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many registration attempts, please try again after 1 hour",
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { authLimiter, registerLimiter };
