import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import FarmerLayout from "../components/FarmerLayout";
import Toast from "../components/Toast";
import { ordersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function FarmerOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadOrder();
  }, [orderId, isAuthenticated]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ordersAPI.get(parseInt(orderId));
      setOrder(data);
    } catch (err) {
      setError(err.message || "Failed to load order details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!order) return;
    
    // ✅ Check if user is a farmer before allowing status updates
    if (user?.role !== 'farmer' && user?.role !== 'admin') {
      showToast("Only farmers can update order status", "error");
      return;
    }
    
    if (newStatus === "rejected" && !window.confirm("Are you sure you want to reject this order?")) {
      return;
    }

    setUpdating(true);
    try {
      await ordersAPI.updateStatus(order.id, newStatus);
      showToast(`Order ${newStatus} successfully`, "success");
      await loadOrder();
      // Navigate back to dashboard after a short delay
      setTimeout(() => navigate("/farmer-dashboard"), 1500);
    } catch (err) {
      // ✅ Better error handling - check for permission errors
      const errorMessage = err.message || "Failed to update order status";
      if (errorMessage.includes("403") || errorMessage.includes("permission") || errorMessage.includes("authorized")) {
        showToast("You don't have permission to update order status. Please log in as a farmer.", "error");
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
      <FarmerLayout activeTab="orders">
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </FarmerLayout>
    );
  }

  if (error || !order) {
    return (
      <FarmerLayout activeTab="orders">
        <div className="flex items-center justify-center py-20">
          <p className="text-red-600">{error || "Order not found"}</p>
        </div>
      </FarmerLayout>
    );
  }

  // Filter items that belong to this farmer
  const farmerItems = order.items?.filter(item => 
    item.product?.farmer_id === user?.id
  ) || [];
  
  // ✅ Check if current user is a farmer (can update order status)
  const isFarmer = user?.role === 'farmer' || user?.role === 'admin';

  return (
    <FarmerLayout activeTab="orders">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate("/farmer-dashboard")}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Order #{order.id}
              </h1>
              <p className="text-sm text-gray-500">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </span>
          </div>

          {/* Cancellation Reason */}
          {order.status?.toLowerCase() === 'cancelled' && order.cancellation_reason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">Cancellation Reason:</p>
              <p className="text-sm text-red-700">{order.cancellation_reason}</p>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <p className="text-lg font-semibold text-gray-800">
              Total Amount: ₹{order.total_amount?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="font-semibold text-gray-800">{order.buyer?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-semibold text-gray-800">{order.buyer_email || order.buyer?.email || "N/A"}</p>
            </div>
            {order.buyer?.phone && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="font-semibold text-gray-800">{order.buyer.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Delivery or Pickup */}
        <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Delivery / Pickup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <p className="font-semibold text-gray-800 capitalize">
                {order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}
              </p>
            </div>
            {order.preferred_date && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Preferred date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(order.preferred_date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        {order.shipping_address && (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Shipping Address</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">{order.shipping_address}</p>
            </div>
          </div>
        )}

        {/* Payment Method */}
        {order.payment_method && (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 font-semibold capitalize">
                {order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method}
              </p>
            </div>
          </div>
        )}

        {/* Product Requirements */}
        <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Product Requirements</h2>
          <div className="space-y-4">
            {farmerItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No products in this order</p>
            ) : (
              farmerItems.map((item) => (
                <div key={item.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {item.product?.name || `Product #${item.product_id}`}
                      </h3>
                      {item.product?.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.product.description}</p>
                      )}
                      {item.product?.category && (
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          Category: {item.product.category}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-800">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: ₹{item.price?.toFixed(2)} each
                      </p>
                      <p className="font-semibold text-green-700 mt-1">
                        Subtotal: ₹{(item.quantity * item.price)?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons - Only show for farmers */}
        {isFarmer && order.status === "pending" && (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("accepted")}
                disabled={updating}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                Accept Order
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={updating}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Reject Order
              </button>
            </div>
          </div>
        )}
        
        {/* Show message if user is not a farmer */}
        {!isFarmer && order.status === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <p className="text-yellow-800 font-medium">
              ⚠️ Only farmers can accept or reject orders. Please log in as a farmer to manage this order.
            </p>
          </div>
        )}

        {/* Delivery: accepted → Packed → Shipped → Delivered. Pickup: accepted → Completed only */}
        {isFarmer && order.status === "accepted" && order.delivery_type === "pickup" && (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("delivered")}
                disabled={updating}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                Mark as Completed
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Customer will collect on the preferred pickup date.</p>
          </div>
        )}

        {isFarmer && order.status === "accepted" && order.delivery_type !== "pickup" && (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("packed")}
                disabled={updating}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                Mark as Packed
              </button>
            </div>
          </div>
        )}

        {isFarmer && order.status === "packed" && (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("shipped")}
                disabled={updating}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Mark as Shipped
              </button>
            </div>
          </div>
        )}

        {isFarmer && order.status === "shipped" && (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("delivered")}
                disabled={updating}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                Mark as Delivered
              </button>
            </div>
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="center"
          onClose={() => setToast({ show: false })}
        />
      )}
    </FarmerLayout>
  );
}

export default FarmerOrderDetails;
