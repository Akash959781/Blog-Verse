/**
 * ==========================================================================
 * BLOGVERSE - POSTS ROUTES
 * Full CRUD + likes, bookmarks, comments, views
 * ==========================================================================
 */

const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ─── Helper: send validation errors ─────────────────────────────────────────
const validateRequest = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  return null;
};

// ─── GET /api/posts — List all posts (public, with filters & pagination) ─────
router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      status = "published",
      sort = "newest",
      page = 1,
      limit = 20,
      author,
    } = req.query;

    const filter = {};

    // Only show published posts to public, allow filtering by author
    if (author) {
      filter.author = author;
      // When fetching own posts, allow draft status
    } else {
      filter.status = status;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      mostViewed: { views: -1 },
      mostLiked: { "likes.length": -1 }, // Virtual doesn't sort, use aggregation workaround
    };
    const sortQuery = sortOptions[sort] || sortOptions.newest;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Post.countDocuments(filter);

    let postsQuery = Post.find(filter)
      .populate("author", "id name email avatar role")
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .select("-content"); // Exclude full content from list view for performance

    // For mostLiked sort, add aggregation after query
    let posts = await postsQuery;
    if (sort === "mostLiked") {
      posts = posts.sort((a, b) => b.likes.length - a.likes.length);
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch posts." });
  }
});

// ─── GET /api/posts/:id — Single post (public) ───────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "id name email avatar role bio joinedDate"
    );

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    // Increment view count
    post.views = (post.views || 0) + 1;
    await post.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error("Get post error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Post not found." });
    }
    res.status(500).json({ success: false, message: "Failed to fetch post." });
  }
});

// ─── POST /api/posts — Create post (protected) ───────────────────────────────
router.post(
  "/",
  protect,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("excerpt").trim().notEmpty().withMessage("Excerpt is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) return;

    try {
      const { title, slug, category, tags, coverImage, excerpt, content, status, isFeatured } =
        req.body;

      const post = await Post.create({
        title,
        slug: slug || undefined, // Let pre-save hook generate if not provided
        category,
        tags: tags || [],
        coverImage: coverImage || undefined,
        excerpt,
        content,
        author: req.user._id,
        status: status || "published",
        isFeatured: isFeatured || false,
      });

      // Populate author before responding
      await post.populate("author", "id name email avatar role");

      res.status(201).json({
        success: true,
        message: "Post created successfully!",
        post,
      });
    } catch (error) {
      console.error("Create post error:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A post with this title/slug already exists.",
        });
      }
      res.status(500).json({ success: false, message: "Failed to create post." });
    }
  }
);

// ─── PUT /api/posts/:id — Update post (protected, author only) ───────────────
router.put(
  "/:id",
  protect,
  [
    body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
    body("content").optional().trim().notEmpty().withMessage("Content cannot be empty"),
  ],
  async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) return;

    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      // Ensure only the author can edit
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized — you can only edit your own posts.",
        });
      }

      const allowedUpdates = [
        "title", "category", "tags", "coverImage", "excerpt",
        "content", "status", "isFeatured",
      ];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) post[field] = req.body[field];
      });

      // If title changed, regenerate slug
      if (req.body.title) {
        post.slug = req.body.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }

      const updated = await post.save();
      await updated.populate("author", "id name email avatar role");

      res.status(200).json({
        success: true,
        message: "Post updated successfully!",
        post: updated,
      });
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({ success: false, message: "Failed to update post." });
    }
  }
);

// ─── DELETE /api/posts/:id — Delete post (protected, author only) ────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized — you can only delete your own posts.",
      });
    }

    await post.deleteOne();

    res.status(200).json({ success: true, message: "Post deleted successfully." });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ success: false, message: "Failed to delete post." });
  }
});

// ─── POST /api/posts/:id/like — Toggle like (protected) ─────────────────────
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle like." });
  }
});

// ─── POST /api/posts/:id/bookmark — Toggle bookmark (protected) ──────────────
router.post("/:id/bookmark", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const user = await User.findById(req.user._id);
    const alreadyBookmarked = user.bookmarks.includes(req.params.id);

    if (alreadyBookmarked) {
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== req.params.id
      );
    } else {
      user.bookmarks.push(req.params.id);
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      bookmarked: !alreadyBookmarked,
      bookmarksCount: user.bookmarks.length,
    });
  } catch (error) {
    console.error("Bookmark error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle bookmark." });
  }
});

// ─── POST /api/posts/:id/comments — Add comment (protected) ──────────────────
router.post(
  "/:id/comments",
  protect,
  [body("text").trim().notEmpty().withMessage("Comment text is required")],
  async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) return;

    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      const comment = {
        user: req.user._id,
        userName: req.user.name,
        userAvatar: req.user.avatar,
        text: req.body.text,
      };

      post.comments.push(comment);
      await post.save({ validateBeforeSave: false });

      const newComment = post.comments[post.comments.length - 1];

      res.status(201).json({
        success: true,
        message: "Comment added!",
        comment: newComment,
      });
    } catch (error) {
      console.error("Comment error:", error);
      res.status(500).json({ success: false, message: "Failed to add comment." });
    }
  }
);

module.exports = router;
