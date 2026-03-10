import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * CREATE ORDER REQUEST (Branch Staff)
 */
router.post("/", async (req, res) => {

  const { branch_id, product_id, quantity } = req.body;

  try {

    await db.query(
      `INSERT INTO order_requests 
       (branch_id, product_id, quantity)
       VALUES (?, ?, ?)`,
      [branch_id, product_id, quantity]
    );

    res.json({ message: "Order request submitted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating order request" });
  }

});


/**
 * VIEW ORDER REQUESTS
 */
router.get("/", async (req, res) => {

  const { branch_id, role } = req.query;

  try {

    let query = `
     SELECT 
        r.*, 
        p.product_name,
        b.branch_name
        FROM order_requests r
        JOIN products p ON r.product_id = p.product_id
        JOIN branches b ON r.branch_id = b.branch_id
    `;

    let params = [];

    if (role === "BRANCH_STAFF") {
      query += " WHERE r.branch_id = ?";
      params.push(branch_id);
    }

    query += " ORDER BY r.request_date DESC";

    const [rows] = await db.query(query, params);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ message: "Error fetching requests" });
  }

});


/**
 * UPDATE REQUEST STATUS (Admin)
 */
router.put("/:id/status", async (req, res) => {

  const { id } = req.params;
  const { status } = req.body;

  try {

    await db.query(
      `UPDATE order_requests SET status = ? WHERE request_id = ?`,
      [status, id]
    );

    res.json({ message: "Request updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error updating request" });
  }

});

export default router;