/**
 * Migration: Remove unique index from enrollments.transactionId
 *
 * This index was created during early Enrollment development when
 * transactionId was expected to be present at creation time.
 * The current business flow creates the enrollment before payment,
 * so transactionId is NULL on creation. A non-sparse unique index
 * therefore blocks multiple enrollments from being inserted.
 *
 * This migration drops the old index. Do NOT recreate a unique
 * index here. If uniqueness is needed later, add it inside the
 * Payment module as a partial/sparse index after transactionId
 * is populated.
 *
 * Run:
 *   node server/src/scripts/migrations/001-drop-transactionId-unique-index.js
 *
 * NOTE: Development/test use only. Do not run in production
 * without reviewing index impact.
 */

import "dotenv/config";
import mongoose from "mongoose";

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGODB_URI, {
    authSource: "admin",
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });

  console.log("✅ MongoDB Connected Successfully");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database connection not available");
    await mongoose.disconnect();
    process.exit(1);
  }

  const collection = db.collection("enrollments");

  const indexes = await collection.indexes();
  const target = indexes.find((idx) => idx.name === "transactionId_1");

  if (!target) {
    console.log("ℹ️ Index 'transactionId_1' does not exist. Nothing to migrate.");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found index: ${target.name} -> ${JSON.stringify(target.key)}`);
  console.log("Dropping index 'transactionId_1'...");

  await collection.dropIndex("transactionId_1");

  console.log("✅ Index dropped successfully.");

  const remaining = await collection.indexes();
  const stillExists = remaining.find((idx) => idx.name === "transactionId_1");

  if (stillExists) {
    console.error("❌ Index still exists after drop.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Verified: index no longer exists.");
  console.log("Migration completed.");

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
});
