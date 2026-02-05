import React, { useState, useEffect } from "react";
import FarmerLayout from "../components/FarmerLayout";
import ChatBox from "../components/Chatbox";
import InventoryCard from "../components/Inventory";
import GovernmentNews from "../components/GovernmentNews";
import Toast from "../components/Toast";
import { dashboardAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FarmerDashboard() {
  const [activeTab] = useState("dashboard");
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadDashboard();
    }
  }, [authLoading, navigate]);

  const loadDashboard = async () => {
    try {
      const data = await dashboardAPI.farmer();
      setDashboardData(data);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <p className="text-center py-20">Loading dashboard…</p>;
  }

  if (error) {
    return (
      <FarmerLayout activeTab={activeTab}>
        <div className="p-10 text-red-600">{error}</div>
      </FarmerLayout>
    );
  }

  const stats = dashboardData?.statistics || {};
  const orders = dashboardData?.recent_orders || [];
  const products = dashboardData?.products || [];

  return (
    <FarmerLayout activeTab="dashboard">
      {/* MAIN CONTENT */}
      <div className="px-6 md:px-8 py-6">
        {/* FARMER INFO */}
        <div className="bg-white rounded-2xl p-6 shadow border border-green-200 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-green-700">
              {user?.name || "Farmer"}
            </h2>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <div className="text-sm text-gray-500">
            Farmer ID: FC-{user?.id}
          </div>
        </div>

        {/* 🌱 POSITIVE FARMER QUOTE */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-800 font-medium text-lg">
            “The farmer feeds the nation — your work matters every day.”
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Stat title="Total Products" value={stats.total_products} />
          <Stat title="Total Orders" value={stats.total_orders} />
          <Stat title="Total Revenue" value={`₹${stats.total_revenue || 0}`} />
          <Stat title="Low Stock" value={stats.low_stock_count} danger />
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-3 gap-6">
          {/* ORDERS */}
          <div className="col-span-2 bg-white rounded-2xl shadow border border-green-200">
            <div className="px-6 py-4 border-b font-semibold text-gray-800">
              Recent Orders
            </div>
            <div className="p-4">
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No orders yet
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-gray-500">
                    <tr>
                      <th className="text-left py-2">Order</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t">
                        <td className="py-2">#{o.id}</td>
                        <td className="text-center">
                          {o.items?.length || 0}
                        </td>
                        <td className="text-center">
                          ₹{o.total_amount}
                        </td>
                        <td className="text-center capitalize">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-1 rounded text-xs ${
                              o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              o.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              o.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              o.status === 'packed' ? 'bg-purple-100 text-purple-800' :
                              o.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {o.status}
                            </span>
                            {o.status === 'cancelled' && o.cancellation_reason && (
                              <span className="text-xs text-red-600 italic" title={o.cancellation_reason}>
                                {o.cancellation_reason.length > 30 
                                  ? o.cancellation_reason.substring(0, 30) + '...' 
                                  : o.cancellation_reason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => navigate(`/farmer-order/${o.id}`)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col gap-6">
            <GovernmentNews limit={3} />
            <InventoryCard products={products} />
            <ChatBox />
          </div>
        </div>
      </div>

      {/* TOAST */}
      {showToast && (
        <Toast
          message="Please login to access farmer dashboard"
          position="center"
          onClose={() => setShowToast(false)}
        />
      )}
    </FarmerLayout>
  );
}

export default FarmerDashboard;

/* SMALL STAT CARD */
function Stat({ title, value, danger }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
      <p className="text-sm text-gray-600">{title}</p>
      <p
        className={`text-2xl font-bold mt-2 ${
          danger ? "text-red-600" : "text-green-700"
        }`}
      >
        {value || 0}
      </p>
    </div>
  );
}
