import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import logger from "./shared/logger.js";

const startServer = async () => {
  try {
    await connectDB();
    // logger.info("✅ MongoDB Connected Successfully");

    app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port}`);
    });
  } catch (error) {
    logger.error(`❌ Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
