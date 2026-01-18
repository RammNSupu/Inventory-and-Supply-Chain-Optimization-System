console.log("🔥 alertsRoutes file loaded");

import express from "express";
import db from "../config/db.js";

const router = express.Router();

// TEST ROUTE (VERY IMPORTANT)
router.get("/test", (req, res) => {
  res.json({ message: "Alerts route is working" });
});

// CREATE ALERT
router.post("/", async (req, res) => {
  try {
    const { branch_id, product_id, type, message } = req.body;

    await db.query(
      `INSERT INTO alerts (branch_id, product_id, type, message)
       VALUES (?, ?, ?, ?)`,
      [branch_id, product_id || null, type, message]
    );

    res.status(201).json({ message: "Alert created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create alert failed" });
  }
});

// GET ALL ALERTS
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM alerts`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Fetch alerts failed" });
  }
});

// MARK ALERT AS READ
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE alerts SET is_read = 1 WHERE alert_id = ?`,
      [id]
    );

    res.json({ message: "Alert marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});


router.get("/branch/:branch_id", async (req, res) => {
  const { branch_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM alerts WHERE branch_id = ? ORDER BY created_at DESC`,
      [branch_id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching branch alerts" });
  }
});


router.delete("/:alert_id", async (req, res) => {
  const { alert_id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM alerts WHERE alert_id = ?",
      [alert_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json({ message: "Alert deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting alert" });
  }
});


export default router;
