import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",          // add password if you set one
  database: "nova_inventory_system_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;
