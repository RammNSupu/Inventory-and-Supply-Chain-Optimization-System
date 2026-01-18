import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * POST — Record a sale
 * This will:
 * 1. Insert sale record
 * 2. Reduce inventory quantity
 */
router.post("/", async (req, res) => {
  const { branch_id, product_id, quantity_sold, unit_price } = req.body;

  if (!branch_id || !product_id || !quantity_sold || !unit_price) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 1️⃣ Insert sale record
    await db.query(
      `INSERT INTO sales 
       (branch_id, product_id, sale_date, quantity_sold, unit_price)
       VALUES (?, ?, NOW(), ?, ?)`,
      [branch_id, product_id, quantity_sold, unit_price]
    );

    // 2️⃣ Reduce inventory
    const [result] = await db.query(
      `UPDATE inventory 
       SET quantity_on_hand = quantity_on_hand - ?
       WHERE branch_id = ? AND product_id = ?`,
      [quantity_sold, branch_id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventory record not found" });
    }

    res.json({ message: "Sale recorded and inventory updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error recording sale" });
  }
});

/**
 * GET — View sales by branch
 */
router.get("/branch/:branchId", async (req, res) => {
  const { branchId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM sales WHERE branch_id = ? ORDER BY sale_date DESC`,
      [branchId]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sales" });
  }
});

/**
 * GET — View sales by product
 */
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM sales WHERE product_id = ? ORDER BY sale_date DESC`,
      [productId]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sales" });
  }
});

export default router;
