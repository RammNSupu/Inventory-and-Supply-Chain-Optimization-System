import express from "express";
import db from "../config/db.js";
import axios from "axios";

const router = express.Router();

/**
 * AI SUPPLIER RECOMMENDATION
 * POST /api/purchase-orders/recommend-supplier
 */
router.post("/recommend-supplier", async (req, res) => {
  const { product_id, order_quantity } = req.body;

  try {

    const aiResponse = await axios.post(
      "http://127.0.0.1:5000/recommend-supplier-for-order",
      {
        product_id,
        order_quantity
      }
    );

    res.json(aiResponse.data);

  } catch (error) {

    console.error("AI supplier recommendation error:");
    console.error(error.response?.data || error.message);

    res.status(500).json({
      message: "AI supplier recommendation failed"
    });

  }
});

/**
 *  CREATE PURCHASE ORDER (Admin)
 * POST /api/purchase-orders
 */
router.post("/", async (req, res) => {
  const {
    supplier_id,
    branch_id,
    order_date,
    expected_delivery_date,
    items
  } = req.body;

  try {
    // Insert into purchase_orders
    const [poResult] = await db.query(
      `INSERT INTO purchase_orders 
       (supplier_id, branch_id, order_date, expected_delivery_date, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [supplier_id, branch_id, order_date, expected_delivery_date]
    );

    const poId = poResult.insertId;

    // Insert items
    for (const item of items) {
      await db.query(
        `INSERT INTO purchase_order_items
         (po_id, product_id, quantity, unit_cost)
         VALUES (?, ?, ?, ?)`,
        [poId, item.product_id, item.quantity, item.unit_cost]
      );
    }

    res.json({
      message: "Purchase order created successfully",
      po_id: poId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating purchase order" });
  }
});

/**
 * VIEW ALL PURCHASE ORDERS (Admin)
 * GET /api/purchase-orders
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM purchase_orders ORDER BY order_date DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching purchase orders" });
  }
});

/**
 * VIEW PURCHASE ORDERS BY BRANCH
 * GET /api/purchase-orders/branch/:branchId
 */
router.get("/branch/:branchId", async (req, res) => {
  const { branchId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM purchase_orders WHERE branch_id = ?`,
      [branchId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching branch purchase orders" });
  }
});

/**
 * VIEW PURCHASE ORDERS BY SUPPLIER
 * GET /api/purchase-orders/supplier/:supplierId
 */
router.get("/supplier/:supplierId", async (req, res) => {
  const { supplierId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM purchase_orders WHERE supplier_id = ?`,
      [supplierId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching supplier orders" });
  }
});

/**
 * UPDATE PURCHASE ORDER STATUS
 * PUT /api/purchase-orders/:id/status
 */
router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.query(
      `UPDATE purchase_orders SET status = ? WHERE po_id = ?`,
      [status, id]
    );

    res.json({ message: "Purchase order status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating purchase order status" });
  }
});

export default router;
