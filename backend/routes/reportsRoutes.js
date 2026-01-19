import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * ================================
 * STEP 9.1 — BRANCH MONTHLY REPORT
 * ================================
 * GET /api/reports/branch/:branch_id/:month
 */
router.get("/branch/:branch_id/:month", async (req, res) => {
  const { branch_id, month } = req.params;

  try {
    // 1️⃣ Total sales revenue
    const [salesResult] = await db.query(
      `
      SELECT 
        SUM(quantity_sold * unit_price) AS total_revenue
      FROM sales
      WHERE branch_id = ?
        AND DATE_FORMAT(sale_date, '%Y-%m') = ?
      `,
      [branch_id, month]
    );

    // 2️⃣ Top-selling products
    const [topProducts] = await db.query(
      `
      SELECT 
        p.product_name,
        SUM(s.quantity_sold) AS total_sold
      FROM sales s
      JOIN products p ON s.product_id = p.product_id
      WHERE s.branch_id = ?
        AND DATE_FORMAT(s.sale_date, '%Y-%m') = ?
      GROUP BY p.product_name
      ORDER BY total_sold DESC
      LIMIT 5
      `,
      [branch_id, month]
    );

    // 3️⃣ Low stock summary
    const [lowStock] = await db.query(
      `
      SELECT 
        p.product_name,
        i.quantity_on_hand,
        i.reorder_point
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      WHERE i.branch_id = ?
        AND i.quantity_on_hand <= i.reorder_point
      `,
      [branch_id]
    );

    // Final report JSON
    const report = {
      branch_id,
      month,
      total_revenue: salesResult[0].total_revenue || 0,
      top_products: topProducts,
      low_stock_summary: lowStock
    };

    res.json(report);

  } catch (error) {
    console.error("❌ Branch report error:", error);
    res.status(500).json({ message: "Error generating branch report" });
  }
});


/**
 * =================================
 * STEP 9.2 — COMPANY-WIDE REPORT
 * =================================
 * GET /api/reports/company/:month
 */
router.get("/company/:month", async (req, res) => {
  const { month } = req.params;

  try {
    // 1️⃣ Revenue per branch
    const [branchRevenue] = await db.query(
      `
      SELECT 
        b.branch_name,
        SUM(s.quantity_sold * s.unit_price) AS revenue
      FROM branches b
      LEFT JOIN sales s 
        ON b.branch_id = s.branch_id
        AND DATE_FORMAT(s.sale_date, '%Y-%m') = ?
      GROUP BY b.branch_id
      `,
      [month]
    );

    // 2️⃣ Top products company-wide
    const [topProducts] = await db.query(
      `
      SELECT 
        p.product_name,
        SUM(s.quantity_sold) AS total_sold
      FROM sales s
      JOIN products p ON s.product_id = p.product_id
      WHERE DATE_FORMAT(s.sale_date, '%Y-%m') = ?
      GROUP BY p.product_name
      ORDER BY total_sold DESC
      LIMIT 5
      `,
      [month]
    );

    // 3️⃣ Low stock summary (all branches)
    const [lowStock] = await db.query(
      `
      SELECT 
        b.branch_name,
        p.product_name,
        i.quantity_on_hand,
        i.reorder_point
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      JOIN branches b ON i.branch_id = b.branch_id
      WHERE i.quantity_on_hand <= i.reorder_point
      `
    );

    const report = {
      month,
      branch_revenue: branchRevenue,
      top_products: topProducts,
      low_stock_summary: lowStock
    };

    res.json(report);

  } catch (error) {
    console.error("❌ Company report error:", error);
    res.status(500).json({ message: "Error generating company report" });
  }
});

export default router;
