import { useEffect, useState } from "react";
import api from "../api/axios";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const Branches = () => {

  const [branches, setBranches] = useState([]);
  const [branchSales, setBranchSales] = useState([]);
  const [topBranch, setTopBranch] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadAIInsights();
  }, []);

  // ==========================================
  // LOAD NORMAL BRANCH DATA
  // ==========================================
  const loadData = async () => {

    try {

      const [branchesRes, salesRes, topBranchRes, totalSalesRes] =
        await Promise.all([
          api.get("/api/branches"),
          api.get("/api/branches/sales-performance"),
          api.get("/api/branches/top-branch"),
          api.get("/api/branches/total-sales")
        ]);

      setBranches(branchesRes.data || []);
      setBranchSales(salesRes.data || []);
      setTopBranch(topBranchRes.data || null);
      setTotalSales(totalSalesRes.data?.total_sales || 0);

    } catch (error) {

      console.error("Branch page loading error:", error);

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // LOAD AI INSIGHTS FROM FLASK AI ENGINE
  // ==========================================
  const loadAIInsights = async () => {

    try {

      setAiLoading(true);

      const res = await api.get(
        "http://127.0.0.1:5000/alerts?role=admin"
      );

      if (res.data && res.data.alerts) {

        setAiInsights(res.data.alerts);

      } else {

        setAiInsights([]);

      }

    } catch (error) {

      console.error("AI insights loading error:", error);
      setAiInsights([]);

    } finally {

      setAiLoading(false);

    }

  };


  if (loading) {
    return <div className="p-10 text-xl">Loading Branch Dashboard...</div>;
  }

  return (

    <div className="p-8">

      <h1 className="mb-8 text-3xl font-bold">
        Branch Management
      </h1>


      {/* ================= KPI CARDS ================= */}

      <div className="grid grid-cols-3 gap-6 mb-10">

        <KpiCard
          title="Total Branches"
          value={branches.length}
        />

        <KpiCard
          title="Top Performing Branch"
          value={topBranch?.branch_name || "No Sales Yet"}
        />

        <KpiCard
          title="Total Company Sales"
          value={`LKR ${Number(totalSales).toLocaleString()}`}
        />

      </div>


      {/* ================= SALES CHART ================= */}

      <div className="p-6 mb-10 bg-white shadow rounded-xl">

        <h2 className="mb-4 text-xl font-semibold">
          Branch Sales Performance
        </h2>

        {branchSales.length === 0 ? (

          <p className="text-gray-500">
            No sales data available yet.
          </p>

        ) : (

          <ResponsiveContainer width="100%" height={300}>

            <BarChart data={branchSales}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="branch_name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="total_sales"
                fill="#3b82f6"
              />

            </BarChart>

          </ResponsiveContainer>

        )}

      </div>


      {/* ================= BRANCH TABLE ================= */}

      <div className="p-6 mb-10 bg-white shadow rounded-xl">

        <h2 className="mb-4 text-xl font-semibold">
          All Branches
        </h2>

        <table className="w-full border">

          <thead>

            <tr className="bg-gray-200">

              <th className="p-3 border">Branch ID</th>
              <th className="p-3 border">Branch Name</th>
              <th className="p-3 border">Location</th>

            </tr>

          </thead>

          <tbody>

            {branches.map((b) => (

              <tr key={b.branch_id}>

                <td className="p-3 border">
                  {b.branch_id}
                </td>

                <td className="p-3 border">
                  {b.branch_name}
                </td>

                <td className="p-3 border">
                  {b.location}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      {/* ================= AI INSIGHTS ================= */}

      <div className="p-6 bg-purple-100 shadow rounded-xl">

        <div className="flex items-center justify-between mb-4">

          <h2 className="text-xl font-semibold">
            🤖 AI Branch Insights
          </h2>

          <button
            onClick={loadAIInsights}
            className="px-3 py-1 text-sm text-white bg-purple-600 rounded"
          >
            Refresh AI
          </button>

        </div>

        {aiLoading ? (

          <p className="text-gray-700">
            Loading AI insights...
          </p>

        ) : aiInsights.length === 0 ? (

          <p className="text-gray-700">
            No AI alerts generated yet.
          </p>

        ) : (

          <ul className="pl-6 mt-3 text-gray-800 list-disc">

            {aiInsights.map((alert) => (

              <li key={alert.alert_id}>

                {alert.message}

              </li>

            ))}

          </ul>

        )}

      </div>

    </div>

  );

};


const KpiCard = ({ title, value }) => (

  <div className="p-6 bg-white shadow rounded-xl">

    <h4 className="mb-2 text-gray-500">
      {title}
    </h4>

    <h2 className="text-2xl font-bold">
      {value}
    </h2>

  </div>

);

export default Branches;