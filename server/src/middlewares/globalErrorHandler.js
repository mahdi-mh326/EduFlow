import logger from "../shared/logger.js";

const globalErrorHandler = (err, req, res) => {
  const statusCode = err.statusCode || 500;

  logger.error(err.message);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: [],
  });
};

export default globalErrorHandler;