import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
   BRANCH DASHBOARD KPIs
*/
router.get("/branch", async (req, res) => {
  const { branch_id } = req.query;

  try {
    const [inventory] = await db.query(
      "SELECT COUNT(*) AS total_inventory FROM inventory WHERE branch_id = ?",
      [branch_id]
    );

    const [sales] = await db.query(
      "SELECT IFNULL(SUM(quantity_sold * unit_price),0) AS total_sales FROM sales WHERE branch_id = ?",
      [branch_id]
    );

    const [lowStock] = await db.query(
      "SELECT COUNT(*) AS low_stock FROM inventory WHERE branch_id = ? AND quantity_on_hand <= reorder_point",
      [branch_id]
    );

    res.json({
      total_inventory: inventory[0].total_inventory,
      total_sales: sales[0].total_sales,
      low_stock: lowStock[0].low_stock
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching branch dashboard KPIs" });
  }
});

/*
   ADMIN DASHBOARD KPIs
*/
router.get("/admin", async (req, res) => {
  try {
    const [branches] = await db.query(
      "SELECT COUNT(*) AS total_branches FROM branches"
    );

    const [users] = await db.query(
      "SELECT COUNT(*) AS total_users FROM users"
    );

    const [products] = await db.query(
      "SELECT COUNT(*) AS total_products FROM products"
    );

    const [sales] = await db.query(
      "SELECT IFNULL(SUM(quantity_sold * unit_price),0) AS total_sales FROM sales"
    );

    res.json({
      total_branches: branches[0].total_branches,
      total_users: users[0].total_users,
      total_products: products[0].total_products,
      total_sales: sales[0].total_sales
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching admin dashboard KPIs" });
  }
});

/* 
   ADMIN MONTHLY SALES
*/
router.get("/admin-sales-chart", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(sale_date,'%Y-%m') AS month,
        SUM(quantity_sold * unit_price) AS sales
      FROM sales
      GROUP BY DATE_FORMAT(sale_date,'%Y-%m')
      ORDER BY month
      LIMIT 12
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching admin sales chart" });
  }
});

/*ADMIN TOP PRODUCTS*/
router.get("/admin-top-products", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT 
        p.product_name,
        SUM(s.quantity_sold) AS total_sold
      FROM sales s
      JOIN products p ON s.product_id = p.product_id
      GROUP BY p.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching top products" });
  }
});


/* ADMIN TOP PERFORMING BRANCH */
router.get("/admin-top-branch", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT 
        b.branch_name,
        SUM(s.quantity_sold * s.unit_price) AS total_sales
      FROM sales s
      JOIN branches b ON s.branch_id = b.branch_id
      GROUP BY b.branch_name
      ORDER BY total_sales DESC
      LIMIT 1
    `);

    res.json(rows[0]);

  } catch (error) {

    console.error("Top branch error:", error);

    res.status(500).json({
      message: "Error fetching top branch"
    });

  }

});

/*BRANCH MONTHLY SALES (Last 6 Months)*/
router.get("/branch-sales-chart", async (req, res) => {
  const { branch_id } = req.query;

  try {
    const [rows] = await db.query(
      `
       SELECT 
  DATE_FORMAT(sale_date, '%Y-%m') AS month,
  SUM(quantity_sold * unit_price) AS sales
FROM sales
WHERE branch_id = ?
GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
ORDER BY DATE_FORMAT(sale_date, '%Y-%m')

      `,
      [branch_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Chart error:", error);
    res.status(500).json({ message: "Error fetching sales chart" });
  }
});



/* ===============================
   BRANCH TOP PRODUCTS 
=================================*/
router.get("/branch-top-products", async (req, res) => {
  const { branch_id } = req.query;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.product_name,
        SUM(s.quantity_sold) AS total_sold
      FROM sales s
      JOIN products p ON s.product_id = p.product_id
      WHERE s.branch_id = ?
      GROUP BY p.product_name
      ORDER BY total_sold DESC
      LIMIT 5
      `,
      [branch_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Top products error:", error);
    res.status(500).json({ message: "Error fetching top products" });
  }
});


/* ===============================
   BRANCH LOW STOCK PRODUCTS
=================================*/
router.get("/branch-low-stock", async (req, res) => {
  const { branch_id } = req.query;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        i.product_id,
        p.product_name,
        i.quantity_on_hand,
        i.reorder_point
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      WHERE i.branch_id = ?
        AND i.quantity_on_hand <= i.reorder_point
      ORDER BY i.quantity_on_hand ASC
      `,
      [branch_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Low stock error:", error);
    res.status(500).json({ message: "Error fetching low stock products" });
  }
});




export default router;