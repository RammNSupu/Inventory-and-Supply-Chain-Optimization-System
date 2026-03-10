import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Layout from "./components/layout/Layout";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import BranchDashboard from "./pages/BranchDashboard";
import Unauthorized from "./pages/Unauthorized";

import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import PurchaseOrders from "./pages/PurchaseOrders";
import Transfers from "./pages/Transfers";
import AIReports from "./pages/AIReports";
import OrderRequests from "./pages/OrderRequest";
import AIRestock from "./pages/AIRestock";
import Alerts from "./pages/Alerts";
import Branches from "./pages/Branches";
import Users from "./pages/Users";



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Login />} />
           <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            }
          />

          {/* BRANCH */}
          <Route
            path="/branch"
            element={
              <ProtectedRoute role="BRANCH_STAFF">
                <Layout><BranchDashboard /></Layout>
              </ProtectedRoute>
            }
          />

   

          {/* SHARED ROUTES */}
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/order-requests" element={<Layout><OrderRequests /></Layout>} />
          <Route path="/transfers" element={<Layout><Transfers /></Layout>} />
          <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
          <Route path="/ai-reports" element={<Layout><AIReports /></Layout>} />
          <Route path="/ai-restock" element={<Layout><AIRestock /></Layout>} />
          <Route path="/purchase-orders" element={<Layout><PurchaseOrders /></Layout>} />
          <Route path="/branches" element={<Layout><Branches /></Layout>} />  
          <Route path="/users" element={<Layout><Users /></Layout>} />  
        
         
           

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;