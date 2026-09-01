import "../config/dns.js";
import "dotenv/config";
import mongoose from "mongoose";
import logger from "../shared/logger.js";

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  logger.error("Missing MONGODB_URI in environment variables.");
  process.exit(1);
}

const clean = async () => {
  await mongoose.connect(MONGODB_URI, {
    authSource: "admin",
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });

  logger.info("✅ MongoDB Connected Successfully");

  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    const name = collection.collectionName;
    const count = await collection.countDocuments();
    await collection.deleteMany({});
    logger.info(`🧹 Cleared collection "${name}" (${count} documents removed).`);
  }

  logger.info("🎉 Database cleaned completely! All records removed.");
};

clean()
  .catch((error) => {
    logger.error(`Clean failed: ${error.message}`);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
