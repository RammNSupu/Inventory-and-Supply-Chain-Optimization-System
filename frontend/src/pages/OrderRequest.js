import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const OrderRequests = () => {

  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const fetchProducts = async () => {
    const res = await api.get("/api/products");
    setProducts(res.data);
  };

  const fetchRequests = async () => {

    const res = await api.get(
      `/api/order-requests?branch_id=${user.branch_id}&role=${user.role}`
    );

    setRequests(res.data);

  };

  useEffect(() => {
    fetchProducts();
    fetchRequests();
  }, []);

  const submitRequest = async (e) => {

    e.preventDefault();

    await api.post("/api/order-requests", {
      branch_id: user.branch_id,
      product_id: productId,
      quantity
    });

    setProductId("");
    setQuantity("");

    fetchRequests();

  };

  return (

    <div style={{ padding: "30px" }}>

      <h2>Order Requests</h2>

      <div style={{
        background: "#f4f6fb",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "30px"
      }}>

        <h3>Create Order Request</h3>

        <form onSubmit={submitRequest}>

          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
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
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <button type="submit">Submit Request</button>

        </form>

      </div>

      <h3>Your Requests</h3>

      <table border="1" width="100%" cellPadding="10">

        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>

          {requests.map(r => (

            <tr key={r.request_id}>
              <td>{r.request_id}</td>
              <td>{r.product_name}</td>
              <td>{r.quantity}</td>
              <td>{r.status}</td>
              <td>{new Date(r.request_date).toLocaleDateString()}</td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

};

export default OrderRequests;