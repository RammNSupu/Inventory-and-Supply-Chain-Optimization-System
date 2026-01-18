import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * 1️⃣ Create Transfer Request (Branch Staff)
 */
router.post("/", async (req, res) => {
  const {
    from_branch_id,
    to_branch_id,
    product_id,
    quantity,
    transfer_date
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO inter_branch_transfers
       (from_branch_id, to_branch_id, product_id, quantity, transfer_date)
       VALUES (?, ?, ?, ?, ?)`,
      [from_branch_id, to_branch_id, product_id, quantity, transfer_date]
    );

    res.status(201).json({
      message: "Inter-branch transfer request created",
      transfer_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating transfer request" });
  }
});

/**
 * 2️⃣ View All Transfers (Admin)
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM inter_branch_transfers ORDER BY transfer_date DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transfers" });
  }
});

/**
 * 3️⃣ View Transfers by Branch
 */
router.get("/branch/:branchId", async (req, res) => {
  const branchId = req.params.branchId;

  try {
    const [rows] = await db.query(
      `SELECT * FROM inter_branch_transfers
       WHERE from_branch_id = ? OR to_branch_id = ?`,
      [branchId, branchId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching branch transfers" });
  }
});

/**
 * 4️⃣ Approve / Reject / Complete Transfer (Admin)
 */
router.put("/:id/status", async (req, res) => {
  const transferId = req.params.id;
  const { status } = req.body;

  try {
    // Update transfer status
    await db.query(
      `UPDATE inter_branch_transfers SET status = ? WHERE transfer_id = ?`,
      [status, transferId]
    );

    // If completed → update inventory
    if (status === "Completed") {
      const [[transfer]] = await db.query(
        `SELECT * FROM inter_branch_transfers WHERE transfer_id = ?`,
        [transferId]
      );

      // Reduce stock from source branch
      await db.query(
        `UPDATE inventory
         SET quantity_on_hand = quantity_on_hand - ?
         WHERE branch_id = ? AND product_id = ?`,
        [transfer.quantity, transfer.from_branch_id, transfer.product_id]
      );

      // Increase stock in destination branch
      await db.query(
        `UPDATE inventory
         SET quantity_on_hand = quantity_on_hand + ?
         WHERE branch_id = ? AND product_id = ?`,
        [transfer.quantity, transfer.to_branch_id, transfer.product_id]
      );
    }

    res.json({ message: "Transfer status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating transfer status" });
  }
});

export default router;
