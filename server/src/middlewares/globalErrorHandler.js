import { ZodError } from "zod";
import logger from "../shared/logger.js";

const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = [];

  // ZodError — Zod v4 uses `issues`; Zod v3 uses `errors`. Support both safely.
  if (err instanceof ZodError) {
    const issues = err.issues ?? err.errors ?? [];
    statusCode = 400;
    message = issues[0]?.message || "Validation failed";
    errors = issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }

  // Mongoose duplicate key
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
    errors = [{ field, message }];
  }

  // Mongoose CastError
  else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
    errors = [{ field: err.path, message }];
  }

  // Mongoose ValidationError
  else if (err.name === "ValidationError") {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = errors[0]?.message || "Validation failed";
  }

  // JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    errors = [{ message }];
  }

  else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
    errors = [{ message }];
  }

  // TypeError / ReferenceError
  else if (err instanceof TypeError || err instanceof ReferenceError) {
    statusCode = 500;
    message = "Internal Server Error";
    errors = [];
  }

  // For unhandled 500s, log the full stack so the real cause is visible in server logs.
  // For known operational errors (4xx / handled 5xx), a one-liner is sufficient.
  if (statusCode === 500) {
    logger.error(
      `[${statusCode}] ${err.name || "Error"}: ${err.message}\n${err.stack || "(no stack trace)"}`
    );
  } else {
    logger.error(`[${statusCode}] ${err.message || message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default globalErrorHandler;
