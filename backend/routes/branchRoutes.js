import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================
   GET ALL BRANCHES
========================= */
router.get("/", async (req, res) => {
  try {

    const [rows] = await db.query(
      "SELECT * FROM branches"
    );

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching branches"
    });

  }
});


/* =========================
   BRANCH SALES PERFORMANCE
========================= */
router.get("/sales-performance", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT 
        b.branch_id,
        b.branch_name,
        IFNULL(SUM(s.quantity_sold * s.unit_price),0) AS total_sales
      FROM branches b
      LEFT JOIN sales s
      ON b.branch_id = s.branch_id
      GROUP BY b.branch_id
      ORDER BY total_sales DESC
    `);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching branch sales"
    });

  }

});


/* =========================
   TOP PERFORMING BRANCH
========================= */
router.get("/top-branch", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT 
        b.branch_name,
        IFNULL(SUM(s.quantity_sold * s.unit_price),0) AS total_sales
      FROM branches b
      LEFT JOIN sales s
      ON s.branch_id = b.branch_id
      GROUP BY b.branch_id
      ORDER BY total_sales DESC
      LIMIT 1
    `);

    res.json(rows[0] || {});

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching top branch"
    });

  }

});


/* =========================
   TOTAL COMPANY SALES
========================= */
router.get("/total-sales", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT 
        IFNULL(SUM(quantity_sold * unit_price),0)
        AS total_sales
      FROM sales
    `);

    res.json(rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching total sales"
    });

  }

});


/* =========================
   LOW STOCK BY BRANCH
   (AI Dashboard Support)
========================= */
router.get("/low-stock", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT
        b.branch_name,
        p.product_name,
        i.quantity
      FROM inventory i
      JOIN branches b
      ON i.branch_id = b.branch_id
      JOIN products p
      ON i.product_id = p.product_id
      WHERE i.quantity < 20
      ORDER BY i.quantity ASC
    `);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching low stock data"
    });

  }

});


/* =========================
   BRANCH INVENTORY SUMMARY
========================= */
router.get("/inventory-summary", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT
        b.branch_name,
        COUNT(i.product_id) AS total_products,
        SUM(i.quantity) AS total_stock
      FROM inventory i
      JOIN branches b
      ON i.branch_id = b.branch_id
      GROUP BY b.branch_id
    `);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching inventory summary"
    });

  }

});

export default router;