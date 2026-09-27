/**
 * ==========================================================================
 * BLOGVERSE - USER MODEL
 * Mongoose schema for user accounts with JWT and bcrypt support.
 * Includes seamless fallback to inMemoryStore when MongoDB is disconnected.
 * ==========================================================================
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User: MemoryUser } = require("../utils/inMemoryStore");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },
    avatar: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
    },
    role: {
      type: String,
      default: "Creator & Tech Enthusiast",
      maxlength: [80, "Role cannot exceed 80 characters"],
    },
    bio: {
      type: String,
      default: "Writer and reader on Blogverse.",
      maxlength: [300, "Bio cannot exceed 300 characters"],
    },
    joinedDate: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
    },
    // Bookmarks stored as array of Post IDs
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save Hook: Hash password before saving ───────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if password was modified (or is new)
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare entered password with hashed password ────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance Method: Generate signed JWT ─────────────────────────────────
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      avatar: this.avatar,
      role: this.role,
    },
    process.env.JWT_SECRET || "blogverse_super_secret_jwt_key_change_this_in_production",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ─── Helper: Return safe user object (no password) ───────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const MongooseUser = mongoose.model("User", userSchema);

// Hybrid proxy: uses Mongoose when connected, fallback in-memory store otherwise
const UserProxy = new Proxy(MongooseUser, {
  get(target, prop) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryUser) {
      return MemoryUser[prop];
    }
    return target[prop];
  },
});

module.exports = UserProxy;
