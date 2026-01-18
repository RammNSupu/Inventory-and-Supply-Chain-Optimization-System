import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * GET all users (Admin use)
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
     "SELECT user_id, full_name, email, role, branch_id, is_active FROM users"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

/**
 * CREATE new user (Admin)
 */
router.post("/", async (req, res) => {
  const { name, email, password, role, branch_id } = req.body;

  try {
    await db.query(
      "INSERT INTO users (name, email, password, role, branch_id) VALUES (?, ?, ?, ?, ?)",
      [name, email, password, role, branch_id]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

export default router;
