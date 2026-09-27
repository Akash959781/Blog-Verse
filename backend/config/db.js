/**
 * ==========================================================================
 * BLOGVERSE BACKEND - DATABASE CONNECTION MANAGER
 * Connects to MongoDB Atlas if MONGODB_URI is provided.
 * Gracefully falls back to high-performance In-Memory Data Store if disconnected.
 * ==========================================================================
 */

const mongoose = require("mongoose");
const { memoryStore } = require("../utils/inMemoryStore");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === "" || uri.includes("<your_username>")) {
    console.log("ℹ️  No remote MONGODB_URI configured. Starting with built-in In-Memory Data Store.");
    await memoryStore.init();
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB Connection failed (${error.message}).`);
    console.log("⚡ Auto-switching to built-in In-Memory Data Store for zero-config local operation.");
    await memoryStore.init();
    return false;
  }
};

module.exports = connectDB;
