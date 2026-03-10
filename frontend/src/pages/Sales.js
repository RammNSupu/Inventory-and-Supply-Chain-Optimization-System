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

  // -----------------------------
  // AI DEMAND FORECAST STATES
  // -----------------------------

  const [forecastProduct, setForecastProduct] = useState("");
  const [forecastPrice, setForecastPrice] = useState("");
  const [forecastPromotion, setForecastPromotion] = useState(0);
  const [forecastSeasonality, setForecastSeasonality] = useState("Summer");

  const [predictedDemand, setPredictedDemand] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);


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


  // -----------------------------
  // AI FORECAST PRODUCT SELECT
  // -----------------------------

  const handleForecastProductChange = (id) => {

    setForecastProduct(id);

    const selected = products.find(
      p => p.product_id === parseInt(id)
    );

    if (selected) {
      setForecastPrice(selected.unit_price);
    }

  };


  // -----------------------------
  // AI DEMAND FORECAST REQUEST
  // -----------------------------

  const getDemandForecast = async () => {

    try {

      setLoadingForecast(true);

      const product = products.find(
        p => p.product_id === parseInt(forecastProduct)
      );

      const response = await fetch(
        "http://127.0.0.1:5000/predict-demand",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            price: Number(forecastPrice),
            promotion: Number(forecastPromotion),
            branch: user.branch_name || "Colombo",
            product_id: product?.product_code || "P0001",
            seasonality: forecastSeasonality
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPredictedDemand(data.predicted_demand);
      } else {
        alert(data.error);
      }

    } catch (error) {
      console.error("AI forecast error:", error);
      alert("AI prediction failed");
    } finally {
      setLoadingForecast(false);
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



      {/* SALES HISTORY */}

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



      {/* -------------------------------- */}
      {/* 🔥 AI DEMAND FORECAST PANEL */}
      {/* -------------------------------- */}

      <div style={styles.aiCard}>

        <h3 style={styles.aiTitle}>
          AI Demand Forecast
        </h3>

        <p style={styles.aiSub}>
          Predict next month product demand using machine learning
        </p>

        <div style={styles.form}>

          <select
            style={styles.input}
            value={forecastProduct}
            onChange={(e) =>
              handleForecastProductChange(e.target.value)
            }
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
            value={forecastPrice}
            readOnly
            placeholder="Auto product price"
          />


                <select
        style={styles.input}
        value={forecastPromotion}
        onChange={(e)=>setForecastPromotion(e.target.value)}
      >
  <option value="">Promotion Status</option>
            <option value={0}>No Promotion</option>
            <option value={1}>Promotion</option>
          </select>


          <select
            style={styles.input}
            value={forecastSeasonality}
            onChange={(e)=>setForecastSeasonality(e.target.value)}
          >
            <option>Summer</option>
            <option>Winter</option>
            <option>Rainy</option>
          </select>

        </div>


        <button
          style={styles.aiButton}
          onClick={getDemandForecast}
        >
          {loadingForecast ? "Predicting..." : "Get AI Forecast"}
        </button>


        {predictedDemand !== null && (

          <div style={styles.resultBox}>

            <h2>
              Predicted Demand
            </h2>

            <div style={styles.resultNumber}>
              {predictedDemand}
            </div>

            <p>
              Units expected to be sold next month
            </p>

          </div>

        )}

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
  border: "1px solid #ccc",
  backgroundColor: "#ffffff",
  color: "#000000",
  minWidth: "180px"
},

  button: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },


  // --------------------
  // AI STYLES
  // --------------------

  aiCard: {
    background: "#0f172a",
    color: "#fff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)"
  },

  aiTitle: {
    fontSize: "22px",
    marginBottom: "5px"
  },

  aiSub: {
    opacity: 0.8,
    marginBottom: "20px"
  },

  aiButton: {
    padding: "12px 24px",
    background: "#22c55e",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    marginTop: "15px",
    cursor: "pointer"
  },

  resultBox: {
    marginTop: "25px",
    padding: "20px",
    background: "#1e293b",
    borderRadius: "10px",
    textAlign: "center"
  },

  resultNumber: {
    fontSize: "42px",
    fontWeight: "bold",
    margin: "10px 0"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  }

};

export default Sales;