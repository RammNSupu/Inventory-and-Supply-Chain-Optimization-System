import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET all branches
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM branches");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching branches" });
  }
});

export default router;
