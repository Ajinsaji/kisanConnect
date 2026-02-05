import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import GovernmentNews from "../components/GovernmentNews";
import Toast from "../components/Toast";
import { adminSettingsAPI } from "../services/api";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newsEnabled, setNewsEnabled] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    fetchStats();
    loadNewsSettings();
  }, []);

  const loadNewsSettings = async () => {
    try {
      const response = await adminSettingsAPI.getNewsSettings();
      setNewsEnabled(response.news_enabled);
    } catch (err) {
      console.error("Error loading news settings:", err);
      // Default to enabled if API fails
      setNewsEnabled(true);
    }
  };

  const handleToggleNews = async () => {
    try {
      const response = await adminSettingsAPI.toggleNewsNotifications();
      setNewsEnabled(response.news_enabled);
      setToast({
        show: true,
        message: response.message,
        type: "success"
      });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    } catch (err) {
      setToast({
        show: true,
        message: err.message || "Failed to toggle news notifications",
        type: "error"
      });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    }
  };

  const fetchStats = async () => {
    try {
      // Check for token in both 'token' and 'admin_token' keys
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await fetch("http://localhost:8000/admin/stats", {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to get error details
        let errorMessage = "Failed to fetch stats";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // If 401, redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('admin_token');
          navigate("/admin-login");
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setError(err.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <AdminNavbar />
        <div className="p-4 bg-red-100 text-red-700 rounded m-4">{error}</div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-30">{icon}</div>
      </div>
    </div>
  );

  const GrowthChart = ({ title, series }) => {
    const data = Array.isArray(series) ? series : [];

    if (!data.length) {
      return (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">Not enough data yet to show trend.</p>
        </div>
      );
    }

    const maxTotal = Math.max(
      ...data.map((d) =>
        // Support both user-based and order-based growth shapes
        d.total_orders ?? d.total_users ?? 0
      )
    ) || 1;

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        <div className="flex items-end gap-1 h-32">
          {data.map((point, index) => {
            const totalValue =
              point.total_orders ?? point.total_users ?? 0;
            const newValue =
              point.new_orders ?? point.new_users ?? 0;
            const heightPercent = (totalValue / maxTotal) * 100;
            const dateLabel = point.date || "";
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group"
              >
                <div
                  className="w-full bg-green-200 rounded-t group-hover:bg-green-400 transition-all"
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                  title={`${dateLabel}: ${totalValue} (new: ${newValue})`}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <AdminNavbar />
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome to the KisanConnect administration panel</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Users"
                  value={stats.total_users}
                  icon="👥"
                  color="border-l-4 border-blue-500"
                />
                <StatCard
                  title="Total Farmers"
                  value={stats.total_farmers}
                  icon="🌾"
                  color="border-l-4 border-green-500"
                />
                <StatCard
                  title="Total Buyers"
                  value={stats.total_buyers}
                  icon="🛒"
                  color="border-l-4 border-purple-500"
                />
                <StatCard
                  title="Total Orders"
                  value={stats.total_orders}
                  icon="📦"
                  color="border-l-4 border-orange-500"
                />
                <StatCard
                  title="Total Products"
                  value={stats.total_products}
                  icon="📦"
                  color="border-l-4 border-yellow-500"
                />
                <StatCard
                  title="Banned Users"
                  value={stats.banned_users}
                  icon="🚫"
                  color="border-l-4 border-red-500"
                />
                <StatCard
                  title="Inactive Users"
                  value={stats.inactive_users}
                  icon="⏸️"
                  color="border-l-4 border-gray-500"
                />
                <StatCard
                  title="Total Revenue"
                  value={`₹${stats.total_revenue.toFixed(2)}`}
                  icon="💰"
                  color="border-l-4 border-emerald-500"
                />
              </div>

              {/* User Growth Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <GrowthChart
                  title="Farmer Growth Trend"
                  series={
                    stats.growth?.farmers && stats.growth.farmers.length > 0
                      ? stats.growth.farmers
                      : [
                          {
                            date: "Total",
                            new_users: stats.total_farmers || 0,
                            total_users: stats.total_farmers || 0,
                          },
                        ]
                  }
                />
                <GrowthChart
                  title="Buyer Growth Trend"
                  series={
                    stats.growth?.buyers && stats.growth.buyers.length > 0
                      ? stats.growth.buyers
                      : [
                          {
                            date: "Total",
                            new_users: stats.total_buyers || 0,
                            total_users: stats.total_buyers || 0,
                          },
                        ]
                  }
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => navigate("/admin-users")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition"
                  >
                    👥 Manage Users
                  </button>
                  <button
                    onClick={() => navigate("/admin-farmers")}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition"
                  >
                    🌾 Manage Farmers
                  </button>
                  <button
                    onClick={() => navigate("/admin-orders")}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded transition"
                  >
                    📦 View Orders
                  </button>
                  <button
                    onClick={() => navigate("/admin-chat")}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded transition"
                  >
                    💬 Chat with Farmers
                  </button>
                  <button
                    onClick={() => navigate("/admin-complaints")}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded transition"
                  >
                    ⚠️ View Complaints
                  </button>
                </div>
              </div>

              {/* Government News Section */}
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {newsEnabled ? (
                      <SpeakerWaveIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <SpeakerXMarkIcon className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">Government News Notifications</h3>
                      <p className="text-sm text-gray-600">
                        {newsEnabled 
                          ? "Notifications are enabled for all users" 
                          : "Notifications are muted - users won't see news"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleNews}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      newsEnabled
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {newsEnabled ? (
                      <>
                        <SpeakerXMarkIcon className="w-5 h-5" />
                        Mute Notifications
                      </>
                    ) : (
                      <>
                        <SpeakerWaveIcon className="w-5 h-5" />
                        Unmute Notifications
                      </>
                    )}
                  </button>
                </div>
                {newsEnabled && <GovernmentNews limit={5} />}
                {!newsEnabled && (
                  <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                    <SpeakerXMarkIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Government news notifications are muted</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Click "Unmute Notifications" above to enable news for all users
                    </p>
                  </div>
                )}
              </div>

              {/* Overview Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-bold text-gray-800 mb-2">User Management</h3>
                    <p className="text-sm text-gray-600">
                      Monitor all users and farmers. Ban/unban users as needed. Activate or deactivate accounts.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-bold text-gray-800 mb-2">Order Tracking</h3>
                    <p className="text-sm text-gray-600">
                      View all orders in the system. Check order details and track shipments.
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-bold text-gray-800 mb-2">Communication</h3>
                    <p className="text-sm text-gray-600">
                      Chat directly with farmers to address queries and provide support.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-right"
          onClose={() => setToast({ show: false, message: "", type: "info" })}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
