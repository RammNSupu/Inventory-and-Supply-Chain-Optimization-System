import { useEffect, useState } from "react";
import api from "../api/axios";

const Products = () => {

  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/products", {
        product_name: productName,
        category: category,
        unit_price: price
      });

      setProductName("");
      setCategory("");
      setPrice("");

      fetchProducts();

    } catch (error) {
      console.error("Error adding product", error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product", error);
    }
  };

  return (
    <div style={{ padding: "30px" }}>

      <h2>Products Management</h2>

      <form onSubmit={addProduct} style={{ marginBottom: "30px" }}>

        <input
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
        />

        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <input
          placeholder="Unit Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <button type="submit">Add Product</button>

      </form>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {products.map((p) => (
            <tr key={p.product_id}>

              <td>{p.product_id}</td>
              <td>{p.product_name}</td>
              <td>{p.category}</td>
              <td>{p.unit_price}</td>

              <td>
                <button
                  onClick={() => deleteProduct(p.product_id)}
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
};

export default Products;