import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* ===============================
   GET ALL USERS
================================ */
router.get("/", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        u.branch_id,
        b.branch_name,
        u.is_active
      FROM users u
      LEFT JOIN branches b
      ON u.branch_id = b.branch_id
      ORDER BY u.user_id DESC
    `);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Error fetching users" });

  }
});


/* ===============================
   CREATE USER
================================ */
import bcrypt from "bcrypt";

// ===============================
// CREATE USER
// ===============================
router.post("/", async (req, res) => {
  const { name, email, password, role, branch_id } = req.body;

  try {
    // 1️⃣ Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2️⃣ Insert user
    await db.query(
      `INSERT INTO users 
      (full_name, email, password_hash, role, branch_id)
      VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, branch_id || null]
    );

    res.status(201).json({
      message: "User created successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating user"
    });
  }
});


/* ===============================
   TOGGLE USER STATUS
================================ */
router.put("/toggle/:id", async (req, res) => {

  const { id } = req.params;

  try {

    await db.query(`
      UPDATE users
      SET is_active = NOT is_active
      WHERE user_id = ?
    `, [id]);

    res.json({
      message: "User status updated"
    });

  } catch (error) {

    res.status(500).json({
      message: "Error updating user status"
    });

  }

});


/* ===============================
   DELETE USER
================================ */
router.delete("/:id", async (req, res) => {

  const { id } = req.params;

  try {

    await db.query(
      "DELETE FROM users WHERE user_id = ?",
      [id]
    );

    res.json({
      message: "User deleted"
    });

  } catch (error) {

    res.status(500).json({
      message: "Error deleting user"
    });

  }

});


/* ===============================
   USER STATS (Dashboard cards)
================================ */
router.get("/stats/summary", async (req, res) => {

  try {

    const [[total]] = await db.query(
      "SELECT COUNT(*) AS total_users FROM users"
    );

    const [[active]] = await db.query(
      "SELECT COUNT(*) AS active_users FROM users WHERE is_active = 1"
    );

    const [[admins]] = await db.query(
      "SELECT COUNT(*) AS admin_users FROM users WHERE role = 'admin'"
    );

    res.json({
      total_users: total.total_users,
      active_users: active.active_users,
      admin_users: admins.admin_users
    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching stats"
    });

  }

});

export default router;