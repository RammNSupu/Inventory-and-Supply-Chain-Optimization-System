import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Sales = () => {

  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error loading products");
    }
  };

  // Fetch sales
  const fetchSales = async () => {
    try {
      const res = await api.get("/api/sales", {
        params: {
          branch_id: user.branch_id,
          role: user.role
        }
      });

      setSales(res.data);

    } catch (error) {
      console.error("Error loading sales");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  // Auto fill price
  const handleProductChange = (id) => {

    setProductId(id);

    const selected = products.find(
      p => p.product_id === parseInt(id)
    );

    if (selected) {
      setPrice(selected.unit_price);
    }

  };

  // Record sale
  const recordSale = async (e) => {

    e.preventDefault();

    try {

      await api.post("/api/sales", {
        branch_id: user.branch_id,
        product_id: productId,
        quantity_sold: quantity,
        unit_price: price
      });

      setProductId("");
      setQuantity("");
      setPrice("");

      fetchSales();

      alert("Sale recorded successfully");

    } catch (error) {

  console.error("Sale error:", error.response?.data || error.message);
  alert("Failed to record sale");

}

    

  };

  return (

    <div style={styles.container}>

      <h1 style={styles.title}>Sales Dashboard</h1>

      {/* Record Sale Card */}
      <div style={styles.card}>

        <h3 style={styles.cardTitle}>Record New Sale</h3>

        <form onSubmit={recordSale} style={styles.form}>

          <select
            style={styles.input}
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            required
          >
            <option value="">Select Product</option>

            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
              </option>
            ))}

          </select>

          <input
            style={styles.input}
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <input
            style={styles.input}
            type="number"
            value={price}
            readOnly
            placeholder="Unit Price"
          />

          <button style={styles.button}>
            Record Sale
          </button>

        </form>

      </div>

      {/* Sales Table */}
      <div style={styles.card}>

        <h3 style={styles.cardTitle}>Sales History</h3>

        <table style={styles.table}>

          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>

            {sales.map(s => {

              const product = products.find(
                p => p.product_id === s.product_id
              );

              return (

                <tr key={s.sale_id}>

                  <td>
                    {new Date(s.sale_date).toLocaleDateString()}
                  </td>

                  <td>
                    {product ? product.product_name : s.product_id}
                  </td>

                  <td>{s.quantity_sold}</td>

                  <td>{s.unit_price}</td>

                  <td>
                    {s.quantity_sold * s.unit_price}
                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </div>

  );

};


// Styles
const styles = {

  container: {
    padding: "40px",
    background: "#f4f6f9",
    minHeight: "100vh",
    fontFamily: "Arial"
  },

  title: {
    marginBottom: "30px"
  },

  card: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
  },

  cardTitle: {
    marginBottom: "15px"
  },

  form: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap"
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },

  button: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  }

};

export default Sales;