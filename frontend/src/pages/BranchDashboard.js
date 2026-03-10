import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";

const BranchDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);

  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {

    const fetchKPIs = async () => {
      try {
        const res = await api.get("/api/dashboard/branch", {
          params: { branch_id: user.branch_id }
        });
        setKpis(res.data);
      } catch (error) {
        console.error("Error fetching dashboard KPIs");
      }
    };

    fetchKPIs();

    const fetchSalesChart = async () => {
      try {
        const res = await api.get("/api/dashboard/branch-sales-chart", {
          params: { branch_id: user.branch_id }
        });
        setSalesData(res.data);
      } catch (error) {
        console.error("Error fetching chart data");
      }
    };

    fetchSalesChart();

    const fetchTopProducts = async () => {
      try {
        const res = await api.get("/api/dashboard/branch-top-products", {
          params: { branch_id: user.branch_id }
        });

        setTopProducts(res.data);
      } catch (error) {
        console.error("Error fetching top products");
      }
    };

    fetchTopProducts();

    const fetchLowStock = async () => {
      try {
        const res = await api.get("/api/dashboard/branch-low-stock", {
          params: { branch_id: user.branch_id }
        });

        setLowStockProducts(res.data);
      } catch (error) {
        console.error("Error fetching low stock products");
      }
    };

    fetchLowStock();

  }, [user]);

  if (!kpis) return <h2 className="text-xl font-semibold">Loading...</h2>;

  return (
    <div className="min-h-screen p-6 space-y-10 bg-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          Branch Dashboard
        </h1>

        <div className="text-sm text-gray-500">
          Welcome back
        </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">

        <KpiCard
          title="Total Inventory"
          value={kpis.total_inventory}
          color="bg-blue-500"
        />

        <KpiCard
          title="Total Sales (LKR)"
          value={kpis.total_sales}
          color="bg-green-500"
        />

        <KpiCard
          title="Low Stock Items"
          value={kpis.low_stock}
          color="bg-red-500"
        />

      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">

        {/* Monthly Sales */}
        <div className="p-6 bg-white shadow-md rounded-2xl">

          <h2 className="mb-6 text-lg font-semibold text-gray-700">
            Monthly Sales Overview
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#6366F1"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        {/* Top Products */}
        <div className="p-6 bg-white shadow-md rounded-2xl">

          <h2 className="mb-6 text-lg font-semibold text-gray-700">
            Top Selling Products
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <XAxis dataKey="product_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_sold" fill="#8B5CF6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* LOW STOCK TABLE */}
      <div className="p-6 bg-white shadow-md rounded-2xl">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-lg font-semibold text-red-600">
            Low Stock Alerts
          </h2>

        </div>

        {lowStockProducts.length === 0 ? (
          <p className="text-gray-500">
            All products are sufficiently stocked.
          </p>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="text-gray-500 border-b">

                <tr>
                  <th className="py-3 text-left">Product</th>
                  <th className="py-3 text-left">Current Qty</th>
                  <th className="py-3 text-left">Reorder Point</th>
                  <th className="py-3 text-left">Action</th>
                </tr>

              </thead>

              <tbody>

                {lowStockProducts.map((item, index) => (

                  <tr
                    key={index}
                    className="transition border-b hover:bg-gray-50"
                  >

                    <td className="py-3 font-medium">
                      {item.product_name}
                    </td>

                    <td className="py-3 font-semibold text-red-500">
                      {item.quantity_on_hand}
                    </td>

                    <td className="py-3">
                      {item.reorder_point}
                    </td>

                    <td className="py-3">

                      <button
                        onClick={() =>
                          navigate(`/branch/reorder/${item.product_id}`)
                        }
                        className="px-4 py-1 text-xs font-semibold text-white bg-red-500 rounded-full hover:bg-red-600"
                      >
                        Reorder
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};


const KpiCard = ({ title, value, color }) => (

  <div className="p-6 transition bg-white shadow-md rounded-2xl hover:shadow-xl">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-gray-800">
          {value}
        </h2>

      </div>

      <div
        className={`${color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg`}
      >
        📊
      </div>

    </div>

  </div>

);

export default BranchDashboard;