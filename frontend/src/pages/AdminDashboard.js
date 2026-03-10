import { useEffect, useState } from "react";
import api from "../api/axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer
} from "recharts";

const AdminDashboard = () => {

  const [kpis, setKpis] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topBranch, setTopBranch] = useState(null);

  useEffect(() => {

    fetchKPIs();
    fetchSalesChart();
    fetchTopProducts();
    fetchTopBranch();

  }, []);

  const fetchKPIs = async () => {

    try {
      const res = await api.get("/api/dashboard/admin");
      setKpis(res.data);
    } catch (error) {
      console.error("Error fetching KPIs");
    }

  };

  const fetchSalesChart = async () => {

    try {
      const res = await api.get("/api/dashboard/admin-sales-chart");
      setSalesChart(res.data);
    } catch (error) {
      console.error("Error fetching sales chart");
    }

  };

  const fetchTopProducts = async () => {

    try {
      const res = await api.get("/api/dashboard/admin-top-products");
      setTopProducts(res.data);
    } catch (error) {
      console.error("Error fetching top products");
    }

  };

  const fetchTopBranch = async () => {

  try {

    const res = await api.get("/api/dashboard/admin-top-branch");
    setTopBranch(res.data);

  } catch (error) {

    console.error("Error fetching top branch");

  }

};

  if (!kpis) return <h2>Loading Dashboard...</h2>;

  return (

    <div className="min-h-screen p-8 bg-gray-100">

      <h1 className="mb-8 text-3xl font-bold">
        Admin Dashboard
      </h1>

      {/* KPI CARDS */}

      <div className="grid grid-cols-4 gap-6 mb-10">

        <KpiCard title="Total Branches" value={kpis.total_branches}/>
        <KpiCard title="Total Users" value={kpis.total_users}/>
        <KpiCard title="Total Products" value={kpis.total_products}/>
        <KpiCard title="Total Sales (LKR)" value={kpis.total_sales}/>

      </div>
      {topBranch && (

<div className="p-6 mb-10 bg-yellow-100 shadow rounded-xl">

  <h2 className="mb-2 text-xl font-semibold">
    🏆 Top Performing Branch
  </h2>

  <h3 className="text-2xl font-bold">
    {topBranch.branch_name}
  </h3>

  <p className="text-lg">
    LKR {topBranch.total_sales}
  </p>

</div>

)}

      {/* SALES CHART */}

      <div className="p-6 mb-10 bg-white shadow rounded-xl">

        <h2 className="mb-4 text-xl font-semibold">
          Monthly Sales Overview
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <LineChart data={salesChart}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      {/* TOP PRODUCTS */}

      <div className="p-6 mb-10 bg-white shadow rounded-xl">

        <h2 className="mb-4 text-xl font-semibold">
          Top Selling Products
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={topProducts}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="product_name"/>
            <YAxis />
            <Tooltip />

            <Bar
              dataKey="total_sold"
              fill="#10b981"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );

};

const KpiCard = ({ title, value }) => (

  <div className="p-6 bg-white shadow rounded-xl">

    <h4 className="mb-2 text-gray-500">
      {title}
    </h4>

    <h2 className="text-3xl font-bold">
      {value}
    </h2>

  </div>

);

export default AdminDashboard;