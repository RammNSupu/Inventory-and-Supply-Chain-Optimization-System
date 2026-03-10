import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const adminMenu = [
    { name: "Dashboard", path: "/admin" },
    { name: "Branches", path: "/branches" },
    { name: "Users", path: "/users" },
    { name: "Products", path: "/products" },
    { name: "Inventory", path: "/inventory" },
    { name: "Sales", path: "/sales" },
    { name: "Purchase Orders", path: "/purchase-orders" },
    { name: "Transfers", path: "/transfers" },
    { name: "AI Reports", path: "/ai-reports" },
    { name: "Alerts", path: "/alerts" }
  ];

  const branchMenu = [
    { name: "Dashboard", path: "/branch" },
    { name: "Products", path: "/products" },
    { name: "Inventory", path: "/inventory" },
    { name: "Sales", path: "/sales" },
    { name: "Order Requests", path: "/order-requests" },
    { name: "Inter-Branch Transfer", path: "/transfers" },
    { name: "AI Reports", path: "/ai-reports" },
    { name: "Alerts", path: "/alerts" }
  ];

  const menu = user?.role === "ADMIN" ? adminMenu : branchMenu;

  return (
    <div className="flex flex-col w-64 h-screen text-white shadow-lg bg-primary">
      <div className="p-6 text-2xl font-bold border-b border-gray-700">
        NOVA IMS
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`block px-4 py-3 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-accent text-white"
                : "hover:bg-gray-700"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;