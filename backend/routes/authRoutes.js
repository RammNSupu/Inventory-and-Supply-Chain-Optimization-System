import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT user_id, full_name, email, password_hash, role, branch_id FROM users WHERE email = ? AND is_active = TRUE",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // Simple password check (no hashing for now)
    if (user.password_hash !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      user_id: user.user_id,
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id
    });

  } catch (error) {
    res.status(500).json({ message: "Login error" });
  }
});

export default router;