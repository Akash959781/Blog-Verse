/**
 * ==========================================================================
 * BLOGVERSE - AUTH ROUTES
 * POST /api/auth/register — Create account
 * POST /api/auth/login    — Login + return JWT
 * GET  /api/auth/me       — Get current user profile
 * PUT  /api/auth/me       — Update current user profile
 * ==========================================================================
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
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

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) return;

    try {
      const { name, email, password, avatar, role, bio } = req.body;

      // Check if email already registered
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered. Please log in.",
        });
      }

      // Create new user (password hashed by pre-save hook)
      const user = await User.create({
        name,
        email,
        password,
        avatar: avatar || undefined,
        role: role || undefined,
        bio: bio || undefined,
      });

      const token = user.generateJWT();

      res.status(201).json({
        success: true,
        message: "Account created successfully!",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio,
          joinedDate: user.joinedDate,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ success: false, message: "Server error during registration." });
    }
  }
);

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) return;

    try {
      const { email, password } = req.body;

      // Find user and explicitly select password (it's excluded by default)
      const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "No account found with that email address.",
        });
      }

      // Compare password with bcrypt hash
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password. Please try again.",
        });
      }

      const token = user.generateJWT();

      res.status(200).json({
        success: true,
        message: "Login successful!",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio,
          joinedDate: user.joinedDate,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Server error during login." });
    }
  }
);

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("bookmarks", "id title slug coverImage category publishedDate");
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        joinedDate: user.joinedDate,
        bookmarks: user.bookmarks,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user profile." });
  }
});

// ─── PUT /api/auth/me ────────────────────────────────────────────────────────
router.put(
  "/me",
  protect,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Please provide a valid email"),
    body("bio").optional().isLength({ max: 300 }).withMessage("Bio cannot exceed 300 characters"),
  ],
  async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) return;

    try {
      const allowedFields = ["name", "avatar", "role", "bio"];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });

      const token = user.generateJWT(); // Refresh token with updated payload

      res.status(200).json({
        success: true,
        message: "Profile updated successfully!",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio,
          joinedDate: user.joinedDate,
        },
      });
    } catch (error) {
      console.error("Update me error:", error);
      res.status(500).json({ success: false, message: "Failed to update profile." });
    }
  }
);

module.exports = router;
