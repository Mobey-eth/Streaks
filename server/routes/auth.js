const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../database/connection");
const auth = require("../middleware/auth");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      dailyGoalHours = 6,
      weeklyGoalHours = 40,
    } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, and name are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name, daily_goal_hours, weekly_goal_hours) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, daily_goal_hours, weekly_goal_hours, created_at",
      [email, passwordHash, name, dailyGoalHours, weeklyGoalHours]
    );

    const user = result.rows[0];

    // Create initial streak record
    await pool.query(
      "INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES ($1, 0, 0)",
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        dailyGoalHours: user.daily_goal_hours,
        weeklyGoalHours: user.weekly_goal_hours,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash, name, daily_goal_hours, weekly_goal_hours FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        dailyGoalHours: user.daily_goal_hours,
        weeklyGoalHours: user.weekly_goal_hours,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, daily_goal_hours, weekly_goal_hours, email_notifications, created_at FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      dailyGoalHours: user.daily_goal_hours,
      weeklyGoalHours: user.weekly_goal_hours,
      emailNotifications: user.email_notifications,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user settings
router.put("/settings", auth, async (req, res) => {
  try {
    const { dailyGoalHours, weeklyGoalHours, emailNotifications } = req.body;

    const result = await pool.query(
      "UPDATE users SET daily_goal_hours = $1, weekly_goal_hours = $2, email_notifications = $3 WHERE id = $4 RETURNING id, email, name, daily_goal_hours, weekly_goal_hours, email_notifications",
      [dailyGoalHours, weeklyGoalHours, emailNotifications, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      message: "Settings updated successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        dailyGoalHours: user.daily_goal_hours,
        weeklyGoalHours: user.weekly_goal_hours,
        emailNotifications: user.email_notifications,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
