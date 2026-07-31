import { ZodError } from "zod";
import logger from "../shared/logger.js";

const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = [];

  // ZodError
  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.errors[0]?.message || "Validation failed";
    errors = err.errors.map((e) => ({
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

  logger.error(`[${statusCode}] ${err.message || message}`);

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default globalErrorHandler;
