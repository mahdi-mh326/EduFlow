import mongoose from "mongoose";
import env from "./env.js";
import logger from "../shared/logger.js";

const connectDB = async () => {
  try {
    const mongoUri = env.mongodbUri || "mongodb://localhost:27017/eduflow_db";
    console.log("Attempting to connect to:", mongoUri);
    
    await mongoose.connect(mongoUri, {
      authSource: "admin",
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
    });

    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    console.error("Full error:", error);
    process.exit(1);
  }
};

export default connectDB;