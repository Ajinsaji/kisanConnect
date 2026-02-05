import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AdminNavbar from "../components/AdminNavbar";
import Toast from "../components/Toast";

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, filterStatus, orders]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await fetch("http://localhost:8000/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toString().includes(searchTerm)
      );
    }

    setFilteredOrders(filtered);
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      setSelectedOrder(data);
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNavbar />
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 font-medium transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Management</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by order ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">Order ID</th>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Items</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">#{order.id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{order.buyer_name}</p>
                          <p className="text-sm text-gray-600">{order.buyer_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">₹{order.total_amount}</td>
                      <td className="px-4 py-3">{order.items_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          {order.status === 'cancelled' && order.cancellation_reason && (
                            <span className="text-xs text-red-600 italic" title={order.cancellation_reason}>
                              {order.cancellation_reason.length > 40 
                                ? order.cancellation_reason.substring(0, 40) + '...' 
                                : order.cancellation_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewOrderDetails(order.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <p className="text-center py-8 text-gray-500">No orders found</p>
            )}
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* Order Summary */}
                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="text-2xl font-bold text-gray-800">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`text-lg font-semibold ${selectedOrder.status === 'delivered' ? 'text-green-600' : selectedOrder.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold">₹{selectedOrder.total_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  {selectedOrder.status === 'cancelled' && selectedOrder.cancellation_reason && (
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-bold text-lg mb-3 text-red-600">Cancellation Information</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-800 mb-2">Cancellation Reason:</p>
                        <p className="text-red-700">{selectedOrder.cancellation_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="mb-6 pb-6 border-b">
                    <h3 className="font-bold text-lg mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold">{selectedOrder.buyer?.name || selectedOrder.buyer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{selectedOrder.buyer?.email || selectedOrder.buyer_email}</p>
                      </div>
                      {selectedOrder.buyer?.phone && (
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-semibold">{selectedOrder.buyer.phone}</p>
                        </div>
                      )}
                      {selectedOrder.shipping_address && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Shipping Address</p>
                          <p className="font-semibold">{selectedOrder.shipping_address}</p>
                        </div>
                      )}
                      {selectedOrder.buyer?.address && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-semibold">
                            {[
                              selectedOrder.buyer.address,
                              selectedOrder.buyer.city,
                              selectedOrder.buyer.state,
                              selectedOrder.buyer.postal_code
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Farmers Info */}
                  {selectedOrder.farmers && selectedOrder.farmers.length > 0 && (
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-bold text-lg mb-3">Farmer Information</h3>
                      <div className="space-y-4">
                        {selectedOrder.farmers.map((farmer, index) => (
                          <div key={farmer.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-green-800 mb-2">Farmer {index + 1}</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-semibold">{farmer.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold">{farmer.email}</p>
                              </div>
                              {farmer.phone && (
                                <div>
                                  <p className="text-sm text-gray-600">Phone</p>
                                  <p className="font-semibold">{farmer.phone}</p>
                                </div>
                              )}
                              {farmer.address && (
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-600">Address</p>
                                  <p className="font-semibold">
                                    {[
                                      farmer.address,
                                      farmer.city,
                                      farmer.state
                                    ].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h3 className="font-bold text-lg mb-3">Order Items ({selectedOrder.items.length})</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-4 rounded border">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Product</p>
                              <p className="font-semibold">{item.product_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Farmer</p>
                              <p className="font-semibold">{item.farmer_name}</p>
                              {item.farmer_email && (
                                <p className="text-xs text-gray-500">{item.farmer_email}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Quantity</p>
                              <p className="font-semibold">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Price</p>
                              <p className="font-semibold">₹{item.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="center"
          onClose={() => setToast({ show: false, message: "", type: "info" })}
        />
      )}
    </div>
  );
}

export default AdminOrders;
