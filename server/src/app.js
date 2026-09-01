import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import env from "./config/env.js";

import sendResponse from "./shared/sendResponse.js";
import notFound from "./middlewares/notFound.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import routes from "./routes/index.js";

const app = express();

/* ===========================
   Global Middlewares
=========================== */

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  env.clientUrl,
  env.clientUrl ? env.clientUrl.replace(/\/$/, "") : null,
  "https://mahdi-edu-flow.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.some((o) => o.replace(/\/$/, "") === cleanOrigin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in production to prevent deployment breakage
    },
    credentials: true,
  })
);


if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

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

const uploadsPath = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));


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
