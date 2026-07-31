import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import sendResponse from "./shared/sendResponse.js";
import notFound from "./middlewares/notFound.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import routes from "./routes/index.js";

const app = express();

/* ===========================
   Global Middlewares
=========================== */

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(express.json());

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON in request body",
      errors: [],
    });
  }
  next(err);
});

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

/* ===========================
   Health Check
=========================== */

app.get("/api/v1/health", (req, res) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "EduFlow API is running",
    data: null,
  });
});

app.use("/api/v1", routes);

app.use(notFound);

app.use(globalErrorHandler);

export default app;
