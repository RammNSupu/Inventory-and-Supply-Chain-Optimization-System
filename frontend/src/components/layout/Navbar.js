import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const Navbar = () => {

  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch alerts count
  const fetchAlerts = async () => {
    try {

      const res = await api.get("/api/alerts");

      const unread = res.data.filter(a => !a.is_read).length;

      setUnreadCount(unread);

    } catch (error) {
      console.error("Error fetching alerts");
    }
  };

  useEffect(() => {

  fetchAlerts();

  const interval = setInterval(() => {
    fetchAlerts();
  }, 10000); // every 10 seconds

  return () => clearInterval(interval);

}, []);

  return (

    <div className="flex items-center justify-between px-8 py-4 bg-white shadow-md">

      <h1 className="text-xl font-semibold text-gray-800">
        Dashboard
      </h1>

      <div className="flex items-center gap-6">

        {/* ALERT BELL */}
        <Link to="/alerts" className="relative text-xl">

          🔔

          {unreadCount > 0 && (
            <span className="absolute px-2 text-xs text-white bg-red-500 rounded-full -top-2 -right-2">
              {unreadCount}
            </span>
          )}

        </Link>

        <button
          onClick={logout}
          className="px-4 py-2 text-white transition rounded-lg bg-accent hover:bg-blue-600"
        >
          Logout
        </button>

      </div>

    </div>

  );
};

export default Navbar;