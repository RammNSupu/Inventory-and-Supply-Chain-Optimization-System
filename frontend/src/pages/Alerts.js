import { useEffect, useState } from "react";
import api from "../api/axios";

const Alerts = () => {

  const [alerts, setAlerts] = useState([]);

  // =========================
  // FETCH ALERTS
  // =========================
  const fetchAlerts = async () => {

    try {

      const res = await api.get("/api/alerts");
      setAlerts(res.data);

    } catch (error) {

      console.error("Error fetching alerts");

    }

  };

  useEffect(() => {

  fetchAlerts();

  const interval = setInterval(() => {
    fetchAlerts();
  }, 10000);

  return () => clearInterval(interval);

}, []);

  // =========================
  // MARK AS READ
  // =========================
  const markAsRead = async (id) => {

    try {

      await api.put(`/api/alerts/${id}/read`);

      fetchAlerts();

    } catch (error) {

      console.error("Error updating alert");

    }

  };

  return (

    <div className="p-8">

      <h1 className="mb-6 text-3xl font-bold">
        Alerts
      </h1>

      <div className="bg-white rounded-lg shadow-md">

        <table className="w-full border">

          <thead>

            <tr className="bg-gray-200">
              <th className="p-2 border">Alert</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
            </tr>

          </thead>

          <tbody>

            {alerts.map((alert) => (

              <tr key={alert.alert_id}>

                <td className="p-2 border">{alert.message}</td>

                <td className="p-2 border">
                  {alert.alert_type}
                </td>

                <td className="p-2 border">
                  {new Date(alert.created_at).toLocaleString()}
                </td>

                <td className="p-2 border">
                  {alert.is_read ? "Read" : "Unread"}
                </td>

                <td className="p-2 border">

                  {!alert.is_read && (

                    <button
                      onClick={() => markAsRead(alert.alert_id)}
                      className="px-3 py-1 text-white bg-blue-500 rounded"
                    >
                      Mark Read
                    </button>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default Alerts;