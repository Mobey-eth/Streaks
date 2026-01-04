const jwt = require("jsonwebtoken");
const pool = require("../database/connection");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists
    const result = await pool.query("SELECT id FROM users WHERE id = $1", [
      decoded.userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Token is no longer valid" });
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;
