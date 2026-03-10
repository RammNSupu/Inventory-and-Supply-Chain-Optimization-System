import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Inventory = () => {

  const { user } = useAuth();

  const [inventory, setInventory] = useState([]);
  const [adjustQty, setAdjustQty] = useState({});
  const [type, setType] = useState({});

  const fetchInventory = async () => {
    try {

      const res = await api.get("/api/inventory", {
        params: {
          branch_id: user.branch_id,
          role: user.role
        }
      });

      setInventory(res.data);

    } catch (error) {
      console.error("Error fetching inventory");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const updateStock = async (product_id) => {

    try {

      await api.post("/api/inventory/adjust", {
        branch_id: user.branch_id,
        product_id: product_id,
        quantity: adjustQty[product_id],
        type: type[product_id]
      });

      fetchInventory();

    } catch (error) {
      console.error("Error updating inventory");
    }

  };

  return (
    <div style={{ padding: "30px" }}>

      <h2>Branch Inventory</h2>

      <table border="1" cellPadding="10" width="100%">

        <thead>
          <tr>
            <th>Product ID</th>
            <th>Quantity On Hand</th>
            <th>Safety Stock</th>
            <th>Reorder Point</th>
            <th>Adjust</th>
          </tr>
        </thead>

        <tbody>

          {inventory.map((item) => (

            <tr key={item.inventory_id}>

              <td>{item.product_id}</td>
              <td>{item.quantity_on_hand}</td>
              <td>{item.safety_stock}</td>
              <td>{item.reorder_point}</td>

              <td>

                <input
                  type="number"
                  placeholder="Qty"
                  onChange={(e) =>
                    setAdjustQty({
                      ...adjustQty,
                      [item.product_id]: e.target.value
                    })
                  }
                />

                <select
                  onChange={(e) =>
                    setType({
                      ...type,
                      [item.product_id]: e.target.value
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="receive">Receive</option>
                  <option value="issue">Issue</option>
                  <option value="sale">Sale</option>
                </select>

                <button
                  onClick={() => updateStock(item.product_id)}
                >
                  Update
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
};

export default Inventory;