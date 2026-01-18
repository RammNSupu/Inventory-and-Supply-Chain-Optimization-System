import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * GET all products
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, s.supplier_name
       FROM products p
       LEFT JOIN suppliers s
       ON p.default_supplier_id = s.supplier_id
`  
    );
    res.json(rows);
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: error.message });
}

});

/**
 * CREATE new product
 */
router.post("/", async (req, res) => {
  const {
    product_name,
    sku,
    category,
    unit,
    unit_price,
    default_supplier_id
  } = req.body;

  try {
    await db.query(
      `INSERT INTO products 
       (product_name, sku, category, unit, unit_price, default_supplier_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        product_name,
        sku,
        category,
        unit,
        unit_price,
        default_supplier_id
      ]
    );

    res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: error.message });
}

});

export default router; 
