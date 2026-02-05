import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FarmerLayout from '../components/FarmerLayout';
import Toast from '../components/Toast';
import { dashboardAPI } from '../services/api';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, TruckIcon, XCircleIcon, MagnifyingGlassIcon, BoltIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

function FarmerOrders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [customerEmailFilter, setCustomerEmailFilter] = useState('');
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState('');

  useEffect(() => {
    if (!authLoading) {
      loadOrders();
    }
  }, [authLoading, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardAPI.farmer();
      let allOrders = data?.recent_orders || [];
      
      // Filter by status if not 'all'
      if (statusFilter !== 'all') {
        allOrders = allOrders.filter(order => 
          order.status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Filter by customer name
      if (customerNameFilter.trim()) {
        allOrders = allOrders.filter(order => {
          const buyerName = order.buyer?.name || '';
          return buyerName.toLowerCase().includes(customerNameFilter.toLowerCase());
        });
      }
      
      // Filter by customer email
      if (customerEmailFilter.trim()) {
        allOrders = allOrders.filter(order => {
          const buyerEmail = order.buyer?.email || '';
          return buyerEmail.toLowerCase().includes(customerEmailFilter.toLowerCase());
        });
      }
      
      // Filter by customer phone
      if (customerPhoneFilter.trim()) {
        allOrders = allOrders.filter(order => {
          const buyerPhone = order.buyer?.phone || '';
          return buyerPhone.includes(customerPhoneFilter);
        });
      }
      
      setOrders(allOrders);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'packed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'shipped':
        return <TruckIcon className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleViewOrder = (orderId) => {
    navigate(`/farmer-order/${orderId}`);
  };

  if (loading || authLoading) {
    return (
      <FarmerLayout activeTab="orders">
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </FarmerLayout>
    );
  }

  return (
    <FarmerLayout activeTab="orders">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/farmer-dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-green-700 mb-4 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-600 mt-2">Manage and track all your orders</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Status Filter */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              {['all', 'pending', 'accepted', 'packed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === status
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Customer:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadOrders();
                    }
                  }}
                  placeholder="Search by name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Customer Email
                </label>
                <input
                  type="text"
                  value={customerEmailFilter}
                  onChange={(e) => setCustomerEmailFilter(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadOrders();
                    }
                  }}
                  placeholder="Search by email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  value={customerPhoneFilter}
                  onChange={(e) => setCustomerPhoneFilter(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadOrders();
                    }
                  }}
                  placeholder="Search by phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadOrders}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                Search
              </button>
              {(customerNameFilter || customerEmailFilter || customerPhoneFilter) && (
                <button
                  onClick={() => {
                    setCustomerNameFilter('');
                    setCustomerEmailFilter('');
                    setCustomerPhoneFilter('');
                  }}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-300 rounded-lg hover:bg-red-50 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-green-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 text-sm mt-2">
              {statusFilter !== 'all' 
                ? `No orders with status "${statusFilter}"`
                : "You don't have any orders yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const farmerItems = order.items?.filter(item => 
                item.product?.farmer_id === user?.id
              ) || [];
              
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow border border-green-200 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        {order.delivery_type === 'express_delivery' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-300" title="Express delivery – prioritize this order">
                            <BoltIcon className="w-4 h-4" />
                            Express delivery
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                        </span>
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="text-green-600 hover:text-green-700 font-medium text-sm"
                        >
                          {isExpanded ? 'View Less ▲' : 'View More ▼'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50">
                      {/* Order Items */}
                      {farmerItems.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Items</h4>
                          <div className="space-y-3">
                            {farmerItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">
                                    {item.product?.name || item.product_name || `Item ${idx + 1}`}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Qty: {item.quantity} × ₹{parseFloat(item.price || 0).toFixed(2)}
                                  </p>
                                </div>
                                <p className="font-semibold text-gray-800">
                                  ₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Order Summary */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-500">Subtotal</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">
                            ₹{typeof order.total_amount === 'number'
                              ? order.total_amount.toFixed(2)
                              : parseFloat(order.total_amount || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-500">Delivery</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">Free</p>
                        </div>
                      </div>

                      {/* Customer scheduled date & time */}
                      {(order.preferred_date || order.preferred_time) && (order.delivery_type === 'schedule_delivery' || order.delivery_type === 'express_delivery') && (
                        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Scheduled date & time</h4>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-800">
                            {order.preferred_date && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                                {(() => {
                                  try {
                                    const d = order.preferred_date.split('T')[0];
                                    return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                                  } catch {
                                    return order.preferred_date;
                                  }
                                })()}
                              </span>
                            )}
                            {order.preferred_time && (
                              <span className="inline-flex items-center gap-1.5">
                                <ClockIcon className="w-4 h-4 text-green-600" />
                                {order.preferred_time}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Customer Info */}
                      {order.buyer && (
                        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Details</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Name</p>
                              <p className="font-medium text-gray-800">{order.buyer.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Email</p>
                              <p className="font-medium text-gray-800">{order.buyer.email || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Phone</p>
                              <p className="font-medium text-gray-800">{order.buyer.phone || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delivery Address */}
                      {order.shipping_address && (
                        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Delivery Address</h4>
                            {order.delivery_type === 'express_delivery' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                <BoltIcon className="w-3.5 h-3.5" />
                                Express
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-line">
                            {order.shipping_address}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          View Full Order Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-center"
          onClose={() => setToast({ show: false, message: '', type: 'info' })}
        />
      )}
    </FarmerLayout>
  );
}

export default FarmerOrders;
