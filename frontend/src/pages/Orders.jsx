import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, cartAPI, ratingsAPI, complaintsAPI } from '../services/api';
import CustomerNavbar from '../components/CustomerNavbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import RatingModal from '../components/RatingModal';
import CancelOrderModal from '../components/CancelOrderModal';
import ReportIssueModal from '../components/ReportIssueModal';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, TruckIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [ratingModal, setRatingModal] = useState({ show: false, orderId: null });
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null, productNames: [] });
  const [reportModal, setReportModal] = useState({ show: false, orderId: null });
  const [orderRatings, setOrderRatings] = useState({});

  useEffect(() => {
    loadOrders();
    loadCartCount();
  }, []);

  useEffect(() => {
    // Load ratings for delivered orders
    const loadRatings = async () => {
      for (const order of orders) {
        if (order.status?.toLowerCase() === 'delivered' && !orderRatings[order.id]) {
          try {
            const rating = await ratingsAPI.getOrderRating(order.id);
            if (rating) {
              setOrderRatings(prev => ({ ...prev, [order.id]: rating }));
            }
          } catch (err) {
            // Order might not be rated yet, that's okay
          }
        }
      }
    };
    if (orders.length > 0) {
      loadRatings();
    }
  }, [orders]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ordersAPI.list();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const cartData = await cartAPI.get();
      setCartCount(cartData?.items?.length || 0);
    } catch (err) {
      console.error('Failed to load cart count:', err);
    }
  };

  const handleCancelClick = (order) => {
    // Get product names from order items
    const productNames = order.items?.map(item => 
      item.product?.name || item.product_name || `Product ${item.product_id}`
    ) || [];
    
    setCancelModal({
      show: true,
      orderId: order.id,
      productNames: productNames
    });
  };

  const handleCancelConfirm = async (orderId, reason) => {
    try {
      await ordersAPI.cancel(orderId, reason);
      
      // Get order to show product names in notification
      const order = orders.find(o => o.id === orderId);
      const productNames = order?.items?.map(item => 
        item.product?.name || item.product_name || `Product ${item.product_id}`
      ) || [];
      const productList = productNames.length > 0 
        ? (productNames.length === 1 ? productNames[0] : productNames.join(', '))
        : 'your order';
      
      showToast(`Your order #${orderId} for ${productList} has been cancelled successfully`, 'success');
      await loadOrders();
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
      throw err; // Re-throw to let modal handle it
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const handleRateOrder = async (orderId, rating, comment) => {
    try {
      await ratingsAPI.create(orderId, rating, comment);
      showToast('Thank you for your rating!', 'success');
      // Reload orders to get updated rating
      await loadOrders();
      // Load the new rating
      const newRating = await ratingsAPI.getOrderRating(orderId);
      if (newRating) {
        setOrderRatings(prev => ({ ...prev, [orderId]: newRating }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit rating', 'error');
      throw err;
    }
  };

  const handleReportIssue = async (orderId, complaintType, description) => {
    try {
      await complaintsAPI.create(orderId, complaintType, description);
      showToast('Your complaint has been submitted. We will review it shortly.', 'success');
      await loadOrders();
    } catch (err) {
      showToast(err.message || 'Failed to submit complaint', 'error');
      throw err;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'shipped':
        return <TruckIcon className="w-5 h-5 text-indigo-600" />;
      case 'packed':
        return <TruckIcon className="w-5 h-5 text-purple-600" />;
      case 'accepted':
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-700';
      case 'packed':
        return 'bg-purple-100 text-purple-700';
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <CustomerNavbar title="My Orders" cartCount={cartCount} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CustomerNavbar title="My Orders" cartCount={cartCount} />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customer-dashboard')}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No orders yet</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div
                  className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 cursor-pointer hover:bg-gradient-to-r hover:from-green-100 hover:to-green-200 transition"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Order #{order.id}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.created_at || order.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {/* Show order items in main view */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200"
                            >
                              {item.product?.name || item.product_name || `Item ${idx + 1}`}
                              <span className="ml-2 text-gray-500">
                                (Qty: {item.quantity})
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{typeof order.total_amount === 'number'
                            ? order.total_amount.toFixed(2)
                            : order.total_amount}
                        </p>
                      </div>

                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="font-semibold capitalize">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* View More Button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOrder(expandedOrder === order.id ? null : order.id);
                      }}
                      className="text-sm text-green-600 hover:text-green-700 font-medium px-4 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2"
                    >
                      {expandedOrder === order.id ? 'View Less' : 'View More'}
                      <span className="text-xs">
                        {expandedOrder === order.id ? '▲' : '▼'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Order Details - Expandable */}
                {expandedOrder === order.id && (
                  <div className="p-6 border-t border-gray-200 space-y-6">
                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Items</h3>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">
                                    {item.product?.name || item.product_name || `Item ${idx + 1}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Qty: {item.quantity} × ₹{typeof item.price === 'number'
                                      ? item.price.toFixed(2)
                                      : item.price}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-800">
                                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Farmer Details Card */}
                              {item.product?.farmer && (
                                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                    <span>🚜</span>
                                    Farmer Details
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-gray-600 mb-1">Name</p>
                                      <p className="font-semibold text-gray-800">{item.product.farmer.name}</p>
                                    </div>
                                    {item.product.farmer.email && (
                                      <div>
                                        <p className="text-gray-600 mb-1">Email</p>
                                        <p className="font-semibold text-gray-800">{item.product.farmer.email}</p>
                                      </div>
                                    )}
                                    {item.product.farmer.phone && (
                                      <div>
                                        <p className="text-gray-600 mb-1">Phone</p>
                                        <p className="font-semibold text-gray-800">{item.product.farmer.phone}</p>
                                      </div>
                                    )}
                                    {(item.product.farmer.address || item.product.farmer.city || item.product.farmer.state || item.product.farmer.postal_code) && (
                                      <div className="md:col-span-2">
                                        <p className="text-gray-600 mb-1">Address</p>
                                        <p className="font-semibold text-gray-800">
                                          {[
                                            item.product.farmer.address,
                                            item.product.farmer.city,
                                            item.product.farmer.state,
                                            item.product.farmer.postal_code
                                          ].filter(Boolean).join(', ')}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">₹{typeof order.total_amount === 'number'
                          ? order.total_amount.toFixed(2)
                          : order.total_amount}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-600">Delivery</span>
                        <span className="text-green-600 font-medium">Free</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2 text-lg">
                        <span className="font-semibold text-gray-800">Total</span>
                        <span className="font-bold text-green-600">₹{typeof order.total_amount === 'number'
                          ? order.total_amount.toFixed(2)
                          : order.total_amount}</span>
                      </div>
                    </div>

                    {/* Order Information */}
                    {order.shipping_address && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Delivery Address</h3>
                        <p className="text-gray-600 whitespace-pre-line">{order.shipping_address}</p>
                      </div>
                    )}

                    {/* Rating Section for Delivered Orders */}
                    {order.status?.toLowerCase() === 'delivered' && (
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        {/* Rating Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-3">Your Rating</h3>
                          {orderRatings[order.id] ? (
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-lg ${
                                      star <= orderRatings[order.id].rating
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-sm text-gray-600 ml-2">
                                  ({orderRatings[order.id].rating}/5)
                                </span>
                              </div>
                              {orderRatings[order.id].comment && (
                                <p className="text-sm text-gray-700 mt-2">
                                  "{orderRatings[order.id].comment}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setRatingModal({ show: true, orderId: order.id })}
                              className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium flex items-center justify-center gap-2"
                            >
                              <span>⭐</span>
                              Rate Your Order
                            </button>
                          )}
                        </div>
                        
                        {/* Report Issue Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-3">Report an Issue</h3>
                          <button
                            onClick={() => setReportModal({ show: true, orderId: order.id })}
                            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition font-medium flex items-center justify-center gap-2"
                          >
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            Report Issue
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {order.status?.toLowerCase() !== 'delivered' && order.status?.toLowerCase() !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelClick(order)}
                        className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
                      >
                        Cancel Order
                      </button>
                    )}

                    {/* Show cancellation reason if cancelled */}
                    {order.status?.toLowerCase() === 'cancelled' && order.cancellation_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">Cancellation Reason:</p>
                        <p className="text-sm text-red-700">{order.cancellation_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          duration={3000}
        />
      )}

      {/* Rating Modal */}
      {ratingModal.show && (
        <RatingModal
          orderId={ratingModal.orderId}
          onClose={() => setRatingModal({ show: false, orderId: null })}
          onSubmit={handleRateOrder}
          existingRating={orderRatings[ratingModal.orderId] || null}
        />
      )}

      {/* Cancel Order Modal */}
      {cancelModal.show && (
        <CancelOrderModal
          isOpen={cancelModal.show}
          onClose={() => setCancelModal({ show: false, orderId: null, productNames: [] })}
          onConfirm={handleCancelConfirm}
          orderId={cancelModal.orderId}
          productNames={cancelModal.productNames}
        />
      )}

      {/* Report Issue Modal */}
      {reportModal.show && (
        <ReportIssueModal
          isOpen={reportModal.show}
          onClose={() => setReportModal({ show: false, orderId: null })}
          onSubmit={handleReportIssue}
          orderId={reportModal.orderId}
        />
      )}

      <Footer />
    </div>
  );
}

export default Orders;
