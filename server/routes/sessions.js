const express = require("express");
const pool = require("../database/connection");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all sessions for a user
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT id, date, start_time, end_time, duration_minutes, description, category, created_at, updated_at
      FROM work_sessions 
      WHERE user_id = $1
    `;
    const params = [req.userId];

    if (startDate && endDate) {
      query += " AND date BETWEEN $2 AND $3";
      params.push(startDate, endDate);
    }

    query += " ORDER BY date DESC, created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get session for a specific date
router.get("/date/:date", auth, async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(
      "SELECT id, date, start_time, end_time, duration_minutes, description, category, created_at, updated_at FROM work_sessions WHERE user_id = $1 AND date = $2",
      [req.userId, date]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No session found for this date" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get session by date error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create or update session for a date
router.post("/", auth, async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      durationMinutes,
      description,
      category = "study",
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // Calculate duration if not provided
    let calculatedDuration = durationMinutes;
    if (startTime && endTime && !durationMinutes) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      calculatedDuration = Math.round((end - start) / (1000 * 60)); // minutes
    }

    // Upsert session
    const result = await pool.query(
      `
      INSERT INTO work_sessions (user_id, date, start_time, end_time, duration_minutes, description, category)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        duration_minutes = EXCLUDED.duration_minutes,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, date, start_time, end_time, duration_minutes, description, category, created_at, updated_at
    `,
      [
        req.userId,
        date,
        startTime,
        endTime,
        calculatedDuration,
        description,
        category,
      ]
    );

    const session = result.rows[0];

    // Update daily goal
    await updateDailyGoal(req.userId, date, calculatedDuration);

    res.status(201).json({
      message: "Session saved successfully",
      session,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update session
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, durationMinutes, description, category } =
      req.body;

    // Calculate duration if not provided
    let calculatedDuration = durationMinutes;
    if (startTime && endTime && !durationMinutes) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      calculatedDuration = Math.round((end - start) / (1000 * 60)); // minutes
    }

    const result = await pool.query(
      `
      UPDATE work_sessions 
      SET start_time = $1, end_time = $2, duration_minutes = $3, description = $4, category = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING id, date, start_time, end_time, duration_minutes, description, category, created_at, updated_at
    `,
      [
        startTime,
        endTime,
        calculatedDuration,
        description,
        category,
        id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const session = result.rows[0];

    // Update daily goal
    await updateDailyGoal(req.userId, session.date, calculatedDuration);

    res.json({
      message: "Session updated successfully",
      session,
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete session
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get session date before deleting
    const sessionResult = await pool.query(
      "SELECT date FROM work_sessions WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const sessionDate = sessionResult.rows[0].date;

    // Delete session
    await pool.query(
      "DELETE FROM work_sessions WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    // Update daily goal (set to 0)
    await updateDailyGoal(req.userId, sessionDate, 0);

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to update daily goal
async function updateDailyGoal(userId, date, durationMinutes) {
  try {
    const hours = durationMinutes / 60;

    // Get user's daily goal
    const userResult = await pool.query(
      "SELECT daily_goal_hours FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const dailyGoalHours = userResult.rows[0].daily_goal_hours;
    const goalMet = hours >= dailyGoalHours;

    // Upsert daily goal
    await pool.query(
      `
      INSERT INTO daily_goals (user_id, date, goal_hours, actual_hours, goal_met)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        actual_hours = EXCLUDED.actual_hours,
        goal_met = EXCLUDED.goal_met,
        updated_at = CURRENT_TIMESTAMP
    `,
      [userId, date, dailyGoalHours, hours, goalMet]
    );

    // Update weekly goal
    await updateWeeklyGoal(userId, date);

    // Update streak
    await updateStreak(userId, date, goalMet);
  } catch (error) {
    console.error("Update daily goal error:", error);
  }
}

// Helper function to update weekly goal
async function updateWeeklyGoal(userId, date) {
  try {
    // Get the start of the week (Monday)
    const weekStart = new Date(date);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Get total hours for the week
    const result = await pool.query(
      `
      SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 as total_hours
      FROM work_sessions 
      WHERE user_id = $1 AND date BETWEEN $2 AND $3
    `,
      [
        userId,
        weekStart.toISOString().split("T")[0],
        weekEnd.toISOString().split("T")[0],
      ]
    );

    const totalHours = parseFloat(result.rows[0].total_hours);

    // Get user's weekly goal
    const userResult = await pool.query(
      "SELECT weekly_goal_hours FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const weeklyGoalHours = userResult.rows[0].weekly_goal_hours;
    const goalMet = totalHours >= weeklyGoalHours;

    // Upsert weekly goal
    await pool.query(
      `
      INSERT INTO weekly_goals (user_id, week_start, week_end, goal_hours, actual_hours, goal_met)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET
        actual_hours = EXCLUDED.actual_hours,
        goal_met = EXCLUDED.goal_met,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        userId,
        weekStart.toISOString().split("T")[0],
        weekEnd.toISOString().split("T")[0],
        weeklyGoalHours,
        totalHours,
        goalMet,
      ]
    );
  } catch (error) {
    console.error("Update weekly goal error:", error);
  }
}

// Helper function to update streak
async function updateStreak(userId, date, goalMet) {
  try {
    const result = await pool.query(
      "SELECT current_streak, longest_streak, last_goal_met_date FROM streaks WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) return;

    let { current_streak, longest_streak, last_goal_met_date } = result.rows[0];

    if (goalMet) {
      // Check if this is consecutive day
      if (last_goal_met_date) {
        const lastDate = new Date(last_goal_met_date);
        const currentDate = new Date(date);
        const diffTime = currentDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          current_streak += 1;
        } else if (diffDays > 1) {
          // Gap in streak, reset
          current_streak = 1;
        }
        // If diffDays === 0, it's the same day, don't change streak
      } else {
        // First goal met
        current_streak = 1;
      }

      longest_streak = Math.max(longest_streak, current_streak);
      last_goal_met_date = date;
    } else {
      // Goal not met, reset streak
      current_streak = 0;
    }

    await pool.query(
      `
      UPDATE streaks 
      SET current_streak = $1, longest_streak = $2, last_goal_met_date = $3, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
    `,
      [current_streak, longest_streak, last_goal_met_date, userId]
    );
  } catch (error) {
    console.error("Update streak error:", error);
  }
}

module.exports = router;
