import mongoose from "mongoose";
import env from "./env.js";
import logger from "../shared/logger.js";

const connectDB = async () => {
  try {
    const mongoUri = env.mongodbUri || "mongodb://localhost:27017/eduflow_db";

    await mongoose.connect(mongoUri, {
      authSource: "admin",
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
    });

    logger.info("MongoDB Connected Successfully");
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;