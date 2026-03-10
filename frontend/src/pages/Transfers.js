import { useState, useEffect } from "react";
import api from "../api/axios";

export default function Transfers() {

  const [transfers, setTransfers] = useState([]);
  const [productId, setProductId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [recommendation, setRecommendation] = useState(null);

  // Load transfers from backend
  const loadTransfers = async () => {
    try {
      const res = await api.get("/api/transfers");
      setTransfers(res.data);
    } catch (error) {
      console.error("Error loading transfers");
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  // AI Recommendation
  const getTransferRecommendation = async () => {
  try {

  const res = await api.post(
  "/api/transfers/transfer-recommendation",
  {
    product_id: productId,
    to_branch_id: toBranchId   
  }
);

    if (res.data.recommended_transfer) {
      setRecommendation(res.data.recommended_transfer);
      loadTransfers();
    }

  } catch (error) {
    console.error("AI transfer recommendation error", error);
  }
};

  // ✅ NEW FUNCTION — UPDATE TRANSFER STATUS
  const updateTransferStatus = async (id, status) => {
    try {

      await api.put(`/api/transfers/${id}/status`, {
        status: status
      });

      loadTransfers();

    } catch (error) {
      console.error("Error updating transfer status", error);
    }
  };

  return (
    <div className="p-6">

      {/* PAGE TITLE */}
      <h1 className="mb-6 text-2xl font-bold">
        Inter-Branch Transfers
      </h1>

      {/* AI TRANSFER RECOMMENDATION PANEL */}

      <div className="p-4 mb-8 bg-white rounded shadow">

        <h2 className="mb-4 text-lg font-semibold">
          AI Transfer Recommendation
        </h2>

        <div className="flex gap-4 mb-4">

          <input
            type="number"
            placeholder="Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="p-2 border rounded"
          />

          <input
            type="number"
            placeholder="Destination Branch ID"
            value={toBranchId}
            onChange={(e) => setToBranchId(e.target.value)}
            className="p-2 border rounded"
          />

          <button
            onClick={getTransferRecommendation}
            className="px-4 py-2 text-white bg-blue-500 rounded"
          >
            Get AI Suggestion
          </button>

        </div>

        {recommendation && (
  <div className="p-4 mt-4 bg-gray-100 rounded">

    <p className="mb-2 font-semibold text-green-600">
      ✅ AI Transfer Created Successfully
    </p>

    <p>
      Transfer ID: <b>{recommendation.transfer_id}</b>
    </p>

    <p>
      Transfer <b>{recommendation.quantity}</b> units
    </p>

    <p>
      From Branch <b>{recommendation.from_branch_id}</b>
      {" → "}
      Branch <b>{recommendation.to_branch_id}</b>
    </p>

    <p>
      Product ID: <b>{recommendation.product_id}</b>
    </p>

    <p>
      AI Confidence Score: <b>{recommendation.ai_score}</b>
    </p>

  </div>
)}

      </div>

      {/* TRANSFER TABLE */}

      <div className="overflow-x-auto bg-white rounded shadow">

        <table className="min-w-full">

          <thead className="bg-gray-100">
            <tr>

              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">From Branch</th>
              <th className="p-3 text-left">To Branch</th>
              <th className="p-3 text-left">Quantity</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>

            </tr>
          </thead>

          <tbody>

            {transfers.map((t) => (

              <tr key={t.transfer_id} className="border-t">

                <td className="p-3">{t.transfer_id}</td>

                <td className="p-3">{t.product_id}</td>

                <td className="p-3">{t.from_branch_id}</td>

                <td className="p-3">{t.to_branch_id}</td>

                <td className="p-3">{t.quantity}</td>

                <td className="p-3">{t.transfer_date}</td>

                <td className="p-3">{t.status}</td>

                {/* ✅ NEW ACTION COLUMN */}
                <td className="p-3">

                  {t.status === "Requested" && (

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          updateTransferStatus(t.transfer_id, "Completed")
                        }
                        className="px-3 py-1 text-white bg-green-500 rounded"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          updateTransferStatus(t.transfer_id, "Rejected")
                        }
                        className="px-3 py-1 text-white bg-red-500 rounded"
                      >
                        Reject
                      </button>

                    </div>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}