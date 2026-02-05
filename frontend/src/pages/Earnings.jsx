import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmerLayout from '../components/FarmerLayout';
import Toast from '../components/Toast';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

function Earnings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setToastMessage('Please login to access earnings');
        setShowToast(true);
        setTimeout(() => window.location.href = '/login', 1500);
      } else {
        loadEarnings();
      }
    }
  }, [authLoading, isAuthenticated]);

  const loadEarnings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardAPI.farmer();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || "Failed to load earnings data");
      console.error("Error loading earnings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <FarmerLayout activeTab="earnings">
        <div className="px-5 py-6">
          <p className="text-center py-10">Loading earnings data...</p>
        </div>
      </FarmerLayout>
    );
  }

  if (error) {
    return (
      <FarmerLayout activeTab="earnings">
        <div className="px-5 py-6">
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        </div>
      </FarmerLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = dashboardData?.statistics || {};
  const orders = dashboardData?.recent_orders || [];

  // Calculate earnings from orders
  const totalRevenue = stats.total_revenue || 0;
  const totalOrders = stats.total_orders || 0;
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

  return (
    <FarmerLayout activeTab="earnings">
      <div className="px-5 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/farmer-dashboard')}
            className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-4 font-medium transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>

          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-lg border border-green-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ₹{typeof totalRevenue === 'number' ? totalRevenue.toFixed(2) : totalRevenue}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-lg border border-green-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {totalOrders}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-white rounded-lg border border-green-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Order Value</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    ₹{averageOrderValue}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <CalendarIcon className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="bg-white rounded-lg border border-green-200 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No orders yet. Start selling to see earnings here!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="pb-3 font-semibold">Order ID</th>
                      <th className="pb-3 font-semibold">Items</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-3 font-medium">#{order.id}</td>
                        <td className="py-3">{order.items?.length || 0} item(s)</td>
                        <td className="py-3 font-bold text-green-600">
                          ₹{typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : order.total_amount}
                        </td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Your earnings are calculated based on successful order deliveries. Keep track of your orders to maximize your revenue!
            </p>
          </div>
        </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          position="center"
          onClose={() => setShowToast(false)}
        />
      )}
    </FarmerLayout>
  );
}

export default Earnings;
