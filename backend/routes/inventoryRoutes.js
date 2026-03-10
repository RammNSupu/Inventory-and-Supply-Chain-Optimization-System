import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * GET inventory for a branch
 */
router.get("/", async (req, res) => {
  const { branch_id, role } = req.query;

  try {
    let query = "SELECT * FROM inventory";
    let params = [];

    // filter by branch_id
    if (role === "BRANCH_STAFF") {
      query += " WHERE branch_id = ?";
      params.push(branch_id);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);

  } catch (error) {
    res.status(500).json({ message: "Error fetching inventory" });
  }
});

/**
 * Adjust inventory (receive, issue, sale)
 */
router.post("/adjust", async (req, res) => {
  try {
    let { branch_id, product_id, quantity, type } = req.body;

    // Validation
    if (!branch_id || !product_id || !quantity || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    quantity = Number(quantity);

    if (isNaN(quantity)) {
      return res.status(400).json({ message: "Quantity must be a number" });
    }

    let qtyChange = 0;

    if (type === "receive") {
      qtyChange = quantity;
    } else if (type === "issue" || type === "sale") {
      qtyChange = -quantity;
    } else {
      return res.status(400).json({ message: "Invalid adjustment type" });
    }

    const [result] = await db.query(
      `UPDATE inventory
       SET quantity_on_hand = quantity_on_hand + ?
       WHERE branch_id = ? AND product_id = ?`,
      [qtyChange, branch_id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventory record not found" });
    }

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating inventory" });
  }
});


export default router;
