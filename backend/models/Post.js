/**
 * ==========================================================================
 * BLOGVERSE - POST MODEL
 * Mongoose schema for blog articles with comments, likes, and bookmarks.
 * Includes seamless fallback to inMemoryStore when MongoDB is disconnected.
 * ==========================================================================
 */

const mongoose = require("mongoose");
const { Post: MemoryPost } = require("../utils/inMemoryStore");

// ─── Comment Sub-document Schema ────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
  },
  { timestamps: true }
);

// ─── Post Schema ─────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Tech & AI", "Web Dev", "Design Systems", "Productivity", "Career"],
      default: "Web Dev",
    },
    tags: [{ type: String, trim: true }],
    coverImage: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedDate: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    views: { type: Number, default: 0 },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isFeatured: { type: Boolean, default: false },
    comments: [commentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Like count ───────────────────────────────────────────────────
postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

// ─── Pre-save Hook: Auto-generate slug from title ─────────────────────────
postSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

// ─── Pre-save Hook: Auto-calculate read time from content ─────────────────
postSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const wordCount = this.content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    this.readTime = `${minutes} min read`;
  }
  next();
});

// ─── Index for search performance ────────────────────────────────────────
postSchema.index({ title: "text", excerpt: "text", content: "text" });
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });

const MongoosePost = mongoose.model("Post", postSchema);

// Hybrid proxy: uses Mongoose when connected, fallback in-memory store otherwise
const PostProxy = new Proxy(MongoosePost, {
  get(target, prop) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryPost) {
      return MemoryPost[prop];
    }
    return target[prop];
  },
});

module.exports = PostProxy;
