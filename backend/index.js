import db from "./config/db.js";

import express from "express";
import cors from "cors";
import branchRoutes from "./routes/branchRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import transferRoutes from "./routes/interBranchTransferRoutes.js";
import alertsRoutes from "./routes/alertsRoutes.js";
console.log("🔥 alertsRoutes imported into index.js");












const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend API is running");
});



(async () => {
  try {
    const connection = await db.getConnection();
    console.log("MySQL Database connected successfully");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
})();

app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/alerts", alertsRoutes);












const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
