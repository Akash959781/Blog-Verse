/**
 * ==========================================================================
 * BLOGVERSE BACKEND - EXPRESS SERVER ENTRY POINT
 * ==========================================================================
 */

require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// ─── Initialize Database Connection (Atlas or In-Memory fallback) ─────────────
connectDB();

const app = express();

// ─── Permissive CORS Configuration (Dev & Prod) ──────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow all origins: localhost, 127.0.0.1, file:// (origin is null or undefined), and remote domains
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);
app.options("*", cors());

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Serve Frontend Static Files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "..")));

// ─── Health Check & API Status ────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "✅ Blog-Verse API is running",
    version: "1.0.0",
    database: mongoose.connection && mongoose.connection.readyState === 1 ? "MongoDB Atlas" : "In-Memory Data Store",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      posts: "/api/posts",
    },
  });
});

// ─── Root Route: Serve Web App or API Info ────────────────────────────────────
app.get("/", (req, res, next) => {
  if (req.accepts("html")) {
    return res.sendFile(path.join(__dirname, "..", "index.html"));
  }
  res.json({
    status: "✅ Blog-Verse API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      posts: "/api/posts",
      health: "/api/health",
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));

// ─── 404 Handler for API Routes ──────────────────────────────────────────────
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Blog-Verse API & Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});
