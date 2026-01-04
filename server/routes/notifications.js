const express = require("express");
const nodemailer = require("nodemailer");
const pool = require("../database/connection");
const auth = require("../middleware/auth");

const router = express.Router();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send reminder email
router.post("/send-reminder", auth, async (req, res) => {
  try {
    const { type = "daily" } = req.body;

    // Get user info
    const userResult = await pool.query(
      "SELECT name, email, daily_goal_hours, weekly_goal_hours, email_notifications FROM users WHERE id = $1",
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.email_notifications) {
      return res
        .status(400)
        .json({ message: "Email notifications are disabled" });
    }

    let subject, html;

    if (type === "daily") {
      subject = `Daily Study Reminder - ${user.name}`;
      html = `
        <h2>Daily Study Reminder</h2>
        <p>Hi ${user.name},</p>
        <p>Don't forget to study for at least <strong>${user.daily_goal_hours} hours</strong> today!</p>
        <p>Your weekly goal is <strong>${user.weekly_goal_hours} hours</strong>.</p>
        <p>Keep up the great work and maintain your streak!</p>
        <br>
        <p>Best regards,<br>Streaks Tracker</p>
      `;
    } else if (type === "weekly") {
      subject = `Weekly Study Reminder - ${user.name}`;
      html = `
        <h2>Weekly Study Reminder</h2>
        <p>Hi ${user.name},</p>
        <p>This week, aim to study for at least <strong>${
          user.weekly_goal_hours
        } hours</strong>!</p>
        <p>That's about <strong>${
          Math.round((user.weekly_goal_hours / 7) * 10) / 10
        } hours per day</strong> on average.</p>
        <p>You've got this! 💪</p>
        <br>
        <p>Best regards,<br>Streaks Tracker</p>
      `;
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });

    // Log notification
    await pool.query(
      "INSERT INTO email_notifications (user_id, type, status) VALUES ($1, $2, $3)",
      [req.userId, `reminder_${type}`, "sent"]
    );

    res.json({ message: "Reminder sent successfully" });
  } catch (error) {
    console.error("Send reminder error:", error);

    // Log failed notification
    try {
      await pool.query(
        "INSERT INTO email_notifications (user_id, type, status) VALUES ($1, $2, $3)",
        [req.userId, "reminder", "failed"]
      );
    } catch (logError) {
      console.error("Log notification error:", logError);
    }

    res.status(500).json({ message: "Failed to send reminder" });
  }
});

// Send streak update email
router.post("/send-streak-update", auth, async (req, res) => {
  try {
    const { streakCount, isNewRecord = false } = req.body;

    // Get user info
    const userResult = await pool.query(
      "SELECT name, email, email_notifications FROM users WHERE id = $1",
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.email_notifications) {
      return res
        .status(400)
        .json({ message: "Email notifications are disabled" });
    }

    let subject, html;

    if (isNewRecord) {
      subject = `🎉 New Streak Record! - ${user.name}`;
      html = `
        <h2>🎉 Congratulations!</h2>
        <p>Hi ${user.name},</p>
        <p>You've set a new personal record with a <strong>${streakCount}-day streak</strong>!</p>
        <p>That's absolutely amazing! Keep up the incredible work! 🚀</p>
        <br>
        <p>Best regards,<br>Streaks Tracker</p>
      `;
    } else {
      subject = `Streak Update - ${user.name}`;
      html = `
        <h2>Streak Update</h2>
        <p>Hi ${user.name},</p>
        <p>Your current streak is <strong>${streakCount} days</strong>!</p>
        <p>Keep going strong! Every day counts! 💪</p>
        <br>
        <p>Best regards,<br>Streaks Tracker</p>
      `;
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });

    // Log notification
    await pool.query(
      "INSERT INTO email_notifications (user_id, type, status) VALUES ($1, $2, $3)",
      [req.userId, "streak_update", "sent"]
    );

    res.json({ message: "Streak update sent successfully" });
  } catch (error) {
    console.error("Send streak update error:", error);
    res.status(500).json({ message: "Failed to send streak update" });
  }
});

// Get notification history
router.get("/history", auth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `
      SELECT type, sent_at, status
      FROM email_notifications 
      WHERE user_id = $1
      ORDER BY sent_at DESC
      LIMIT $2
    `,
      [req.userId, parseInt(limit)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get notification history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Test email configuration
router.post("/test", auth, async (req, res) => {
  try {
    // Get user info
    const userResult = await pool.query(
      "SELECT name, email, email_notifications FROM users WHERE id = $1",
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.email_notifications) {
      return res
        .status(400)
        .json({ message: "Email notifications are disabled" });
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Test Email - Streaks Tracker",
      html: `
        <h2>Test Email</h2>
        <p>Hi ${user.name},</p>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p>If you received this email, everything is set up properly! ✅</p>
        <br>
        <p>Best regards,<br>Streaks Tracker</p>
      `,
    });

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ message: "Failed to send test email" });
  }
});

module.exports = router;
