import { useEffect, useState } from "react";
import api from "../api/axios";

const PurchaseOrders = () => {

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState(null);

  const [requests, setRequests] = useState([]);

  // POPUP STATES
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recommendedSupplier, setRecommendedSupplier] = useState(null);

  // =========================
  // AI SUPPLIER RECOMMENDATION (MANUAL)
  // =========================
  const recommendSupplier = async () => {

    try {

      const res = await api.post(
        "/api/purchase-orders/recommend-supplier",
        {
          product_id: productId,
          order_quantity: quantity
        }
      );

      setSupplier(res.data.recommended_supplier);

    } catch (error) {
      console.error("Recommendation error:", error);
    }

  };

  // =========================
  // FETCH ORDER REQUESTS
  // =========================
  const fetchRequests = async () => {

    try {

      const res = await api.get("/api/order-requests");
      setRequests(res.data);

    } catch (err) {

      console.error("Error fetching requests", err);

    }

  };

  useEffect(() => {

    fetchRequests();

  }, []);

  // =========================
  // REJECT REQUEST
  // =========================
  const rejectRequest = async (id) => {

    try {

      await api.put(`/api/order-requests/${id}/status`, {
        status: "Rejected"
      });

      fetchRequests();

    } catch (err) {

      console.error("Error rejecting request", err);

    }

  };

  // =========================
  // OPEN APPROVAL POPUP
  // =========================
  const openApprovalPopup = (request) => {

    setSelectedRequest(request);
    setRecommendedSupplier(null);
    setShowPopup(true);

  };

  // =========================
  // AI SUPPLIER FOR REQUEST
  // =========================
  const getSupplierRecommendation = async () => {

    try {

      const res = await api.post(
        "/api/purchase-orders/recommend-supplier",
        {
          product_id: selectedRequest.product_id,
          order_quantity: selectedRequest.quantity
        }
      );

      console.log("AI RESPONSE:", res.data);

      setRecommendedSupplier(res.data.recommended_supplier);

    } catch (error) {

      console.error("Supplier recommendation failed", error);

    }

  };

  // =========================
  // PLACE PURCHASE ORDER
  // =========================
  const placePurchaseOrder = async () => {

    try {

      if (!recommendedSupplier) {
        alert("No supplier selected");
        return;
      }

      if (!selectedRequest) {
        alert("Request not found");
        return;
      }

      console.log("Creating PO with:", {
        supplier_id: recommendedSupplier.supplier_id,
        branch_id: selectedRequest.branch_id,
        product_id: selectedRequest.product_id
      });

      const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const deliveryDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await api.post("/api/purchase-orders", {

        supplier_id: recommendedSupplier.supplier_id,
        branch_id: selectedRequest.branch_id,

        order_date: orderDate,
        expected_delivery_date: deliveryDate,

        items: [
          {
            product_id: selectedRequest.product_id,
            quantity: selectedRequest.quantity,
            unit_cost: 0
          }
        ]

      });

      console.log("PO CREATED");

      // update request status
      await api.put(
        `/api/order-requests/${selectedRequest.request_id}/status`,
        { status: "Approved" }
      );

      alert("Purchase Order Created Successfully");

      setShowPopup(false);

      fetchRequests();

    } catch (error) {

      console.error("Purchase order creation failed", error);

      alert("Error creating purchase order. Check console.");

    }

  };

  return (

    <div className="p-8">

      <h1 className="mb-6 text-3xl font-bold">
        Purchase Orders
      </h1>

      {/* AI SUPPLIER CARD */}
      <div className="p-6 mb-10 bg-white rounded-lg shadow-md w-96">

        <h2 className="mb-4 text-xl">AI Supplier Recommendation</h2>

        <input
          type="number"
          placeholder="Product ID"
          className="w-full p-2 mb-3 border"
          value={productId}
          onChange={(e)=>setProductId(e.target.value)}
        />

        <input
          type="number"
          placeholder="Order Quantity"
          className="w-full p-2 mb-3 border"
          value={quantity}
          onChange={(e)=>setQuantity(e.target.value)}
        />

        <button
          onClick={recommendSupplier}
          className="px-4 py-2 text-white bg-blue-600 rounded"
        >
          Recommend Supplier
        </button>

        {supplier && (

          <div className="p-4 mt-4 bg-gray-100 rounded">

            <h3 className="font-semibold">Recommended Supplier</h3>

            <p>ID: {supplier.supplier_id}</p>
            <p>Name: {supplier.supplier_name}</p>
            <p>Lead Time: {supplier.lead_time_days} days</p>
            <p>AI Score: {supplier.ai_score}</p>

          </div>

        )}

      </div>


      {/* ADMIN ORDER REQUEST TABLE */}
      <div className="p-6 bg-white rounded-lg shadow-md">

        <h2 className="mb-6 text-2xl font-bold">
          Branch Order Requests
        </h2>

        <table className="w-full border">

          <thead>

            <tr className="bg-gray-200">
              <th className="p-2 border">Request ID</th>
              <th className="p-2 border">Branch</th>
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>

          </thead>

          <tbody>

            {requests.map((r) => (

              <tr key={r.request_id}>

                <td className="p-2 border">{r.request_id}</td>
                <td className="p-2 border">{r.branch_name}</td>
                <td className="p-2 border">{r.product_name}</td>
                <td className="p-2 border">{r.quantity}</td>
                <td className="p-2 border">{r.status}</td>

                <td className="p-2 border">

                  {r.status === "Pending" && (

                    <>
                      <button
                        onClick={() => openApprovalPopup(r)}
                        className="px-3 py-1 mr-2 text-white bg-green-500 rounded"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => rejectRequest(r.request_id)}
                        className="px-3 py-1 text-white bg-red-500 rounded"
                      >
                        Reject
                      </button>
                    </>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      {/* APPROVAL POPUP */}
      {showPopup && selectedRequest && (

        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">

          <div className="p-6 bg-white rounded-lg shadow-lg w-96">

            <h2 className="mb-4 text-xl font-bold">
              Create Purchase Order
            </h2>

            <p>Product ID: {selectedRequest.product_id}</p>
            <p>Branch ID: {selectedRequest.branch_id}</p>
            <p>Quantity: {selectedRequest.quantity}</p>

            <button
              onClick={getSupplierRecommendation}
              className="px-4 py-2 mt-4 text-white bg-blue-600 rounded"
            >
              Recommend Supplier
            </button>

            {recommendedSupplier && (

              <div className="p-3 mt-4 bg-gray-100 rounded">

                <p><b>Supplier:</b> {recommendedSupplier.supplier_name}</p>
                <p><b>Lead Time:</b> {recommendedSupplier.lead_time_days} days</p>
                <p><b>AI Score:</b> {recommendedSupplier.ai_score}</p>

                <button
                  onClick={placePurchaseOrder}
                  className="px-4 py-2 mt-3 text-white bg-green-600 rounded"
                >
                  Place Order
                </button>

              </div>

            )}

            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 text-red-500"
            >
              Cancel
            </button>

          </div>

        </div>

      )}

    </div>

  );

};

export default PurchaseOrders;