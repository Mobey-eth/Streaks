const express = require("express");
const pool = require("../database/connection");
const auth = require("../middleware/auth");

const router = express.Router();

// Get user's streak information
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_streak, longest_streak, last_goal_met_date FROM streaks WHERE user_id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Streak information not found" });
    }

    const streak = result.rows[0];
    res.json(streak);
  } catch (error) {
    console.error("Get streak error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get daily goals for a date range
router.get("/daily-goals", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT date, goal_hours, actual_hours, goal_met
      FROM daily_goals 
      WHERE user_id = $1
    `;
    const params = [req.userId];

    if (startDate && endDate) {
      query += " AND date BETWEEN $2 AND $3";
      params.push(startDate, endDate);
    }

    query += " ORDER BY date DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get daily goals error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get weekly goals for a date range
router.get("/weekly-goals", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT week_start, week_end, goal_hours, actual_hours, goal_met
      FROM weekly_goals 
      WHERE user_id = $1
    `;
    const params = [req.userId];

    if (startDate && endDate) {
      query += " AND week_start BETWEEN $2 AND $3";
      params.push(startDate, endDate);
    }

    query += " ORDER BY week_start DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get weekly goals error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get streak statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysInt = parseInt(days);

    // Get current streak info
    const streakResult = await pool.query(
      "SELECT current_streak, longest_streak, last_goal_met_date FROM streaks WHERE user_id = $1",
      [req.userId]
    );

    const streak = streakResult.rows[0] || {
      current_streak: 0,
      longest_streak: 0,
      last_goal_met_date: null,
    };

    // Get daily goals for the specified period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    const dailyGoalsResult = await pool.query(
      `
      SELECT date, goal_met, actual_hours
      FROM daily_goals 
      WHERE user_id = $1 AND date BETWEEN $2 AND $3
      ORDER BY date DESC
    `,
      [
        req.userId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      ]
    );

    const dailyGoals = dailyGoalsResult.rows;

    // Calculate statistics
    const totalDays = dailyGoals.length;
    const daysGoalMet = dailyGoals.filter((goal) => goal.goal_met).length;
    const successRate = totalDays > 0 ? (daysGoalMet / totalDays) * 100 : 0;

    const totalHours = dailyGoals.reduce(
      (sum, goal) => sum + parseFloat(goal.actual_hours || 0),
      0
    );
    const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

    // Get weekly goals for the period
    const weeklyGoalsResult = await pool.query(
      `
      SELECT week_start, week_end, goal_met, actual_hours
      FROM weekly_goals 
      WHERE user_id = $1 AND week_start >= $2
      ORDER BY week_start DESC
    `,
      [req.userId, startDate.toISOString().split("T")[0]]
    );

    const weeklyGoals = weeklyGoalsResult.rows;
    const weeksGoalMet = weeklyGoals.filter((goal) => goal.goal_met).length;
    const weeklySuccessRate =
      weeklyGoals.length > 0 ? (weeksGoalMet / weeklyGoals.length) * 100 : 0;

    res.json({
      streak: {
        current: streak.current_streak,
        longest: streak.longest_streak,
        lastGoalMetDate: streak.last_goal_met_date,
      },
      period: {
        days: daysInt,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      daily: {
        totalDays,
        daysGoalMet,
        successRate: Math.round(successRate * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
      },
      weekly: {
        totalWeeks: weeklyGoals.length,
        weeksGoalMet,
        successRate: Math.round(weeklySuccessRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Get streak stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get calendar view data
router.get("/calendar", auth, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    const result = await pool.query(
      `
      SELECT 
        dg.date,
        dg.goal_hours,
        dg.actual_hours,
        dg.goal_met,
        ws.duration_minutes,
        ws.description,
        ws.category
      FROM daily_goals dg
      LEFT JOIN work_sessions ws ON dg.user_id = ws.user_id AND dg.date = ws.date
      WHERE dg.user_id = $1 AND dg.date BETWEEN $2 AND $3
      ORDER BY dg.date
    `,
      [
        req.userId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      ]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get calendar data error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
