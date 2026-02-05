import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';
import ReportIssueModal from './ReportIssueModal';
import { messagingAPI, ordersAPI, complaintsAPI, isTimeLockError } from '../services/api';
import {
  ShoppingCartIcon,
  UserIcon,
  BellIcon,
  MapPinIcon,
  HomeIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

function CustomerNavbar({ title = "Customer Dashboard", cartCount = 0 }) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderNotifications, setOrderNotifications] = useState([]);
  const [orderNotificationCount, setOrderNotificationCount] = useState(0);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [notificationOrders, setNotificationOrders] = useState({});
  const [reportModal, setReportModal] = useState({ show: false, orderId: null });
  const [locationClickCount, setLocationClickCount] = useState(0);
  const locationClickResetRef = React.useRef(null);

  const handleLocationClick = () => {
    if (locationClickResetRef.current) clearTimeout(locationClickResetRef.current);
    const next = locationClickCount + 1;
    setLocationClickCount(next);
    if (next >= 5) {
      setLocationClickCount(0);
      return;
    }
    locationClickResetRef.current = setTimeout(() => setLocationClickCount(0), 1500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      setToastMessage('Please login to continue');
      setShowToast(true);
    } else {
      navigate('/cart');
    }
  };

  const handleNotificationToggle = () => {
    if (!isAuthenticated) {
      setToastMessage('Please login to continue');
      setShowToast(true);
    } else {
      setIsNotificationOpen(!isNotificationOpen);
    }
  };

  const handleChatClick = () => {
    if (!isAuthenticated) {
      setToastMessage('Please login to continue');
      setShowToast(true);
    } else {
      navigate('/chat');
    }
  };

  const loadUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await messagingAPI.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      if (!isTimeLockError(err)) console.error('Failed to load unread count:', err);
      setUnreadCount(0);
    }
  };

  const loadOrderNotifications = async () => {
    if (!isAuthenticated) {
      setOrderNotifications([]);
      setOrderNotificationCount(0);
      return;
    }
    try {
      const data = await ordersAPI.getOrderNotifications();
      setOrderNotifications(data);
      setOrderNotificationCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      if (!isTimeLockError(err)) console.error('Failed to load order notifications:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await ordersAPI.markOrderNotificationRead(notification.id);
        await loadOrderNotifications();
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const handleViewMore = async (notification, e) => {
    e.stopPropagation();
    if (expandedNotification === notification.id) {
      setExpandedNotification(null);
      return;
    }
    
    setExpandedNotification(notification.id);
    
    // Load order details if not already loaded
    if (notification.order_id && !notificationOrders[notification.order_id]) {
      try {
        const orderData = await ordersAPI.get(notification.order_id);
        setNotificationOrders(prev => ({
          ...prev,
          [notification.order_id]: orderData
        }));
      } catch (err) {
        console.error('Failed to load order details:', err);
      }
    }
  };

  const handleViewFullOrder = (orderId) => {
    navigate('/orders');
    setIsNotificationOpen(false);
  };

  const handleReportIssue = async (orderId, complaintType, description) => {
    try {
      await complaintsAPI.create(orderId, complaintType, description);
      setToastMessage('Your complaint has been submitted. We will review it shortly.');
      setShowToast(true);
      setIsNotificationOpen(false);
    } catch (err) {
      setToastMessage(err.message || 'Failed to submit complaint');
      setShowToast(true);
      throw err;
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await ordersAPI.deleteNotification(notificationId);
      await loadOrderNotifications();
      setToastMessage('Notification deleted successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage(err.message || 'Failed to delete notification');
      setShowToast(true);
    }
  };

  const handleClearAllNotifications = async () => {
    if (orderNotifications.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete all ${orderNotifications.length} notifications?`)) {
      return;
    }
    
    try {
      await ordersAPI.clearAllNotifications();
      await loadOrderNotifications();
      setToastMessage('All notifications cleared successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage(err.message || 'Failed to clear notifications');
      setShowToast(true);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    loadOrderNotifications();
    // Refresh unread count every 10 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
      loadOrderNotifications();
    }, 10000);
    
    // Listen for messages read event
    const handleMessagesRead = () => {
      loadUnreadCount();
    };
    window.addEventListener('messagesRead', handleMessagesRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, [isAuthenticated]);

  return (
    <div className="w-full bg-white shadow-md border-b-2 border-green-300">
      {/* Colorful top strip */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-orange-400"></div>

      {/* Main Navbar */}
      <div className="px-6 md:px-12 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo/Home */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
            >
              <span className="text-3xl">🌾</span>
              <div>
                <h1 className="text-xl font-bold text-green-700">Kissan Connect</h1>
                <p className="text-xs text-gray-500">{title}</p>
              </div>
            </div>

            {/* Navigation Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => navigate('/customer-dashboard')}
                className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium transition"
                title="Dashboard"
              >
                <HomeIcon className="w-5 h-5" />
                Dashboard
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium transition"
                title="Browse Products"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Browse Products
              </button>

              <button
                onClick={handleChatClick}
                className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium transition relative"
                title="Messages"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-6">
            {/* Location — 5 consecutive clicks navigates to developer mode */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleLocationClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLocationClick(); }}
              className="hidden sm:flex items-center gap-1 text-gray-600 hover:text-green-600 cursor-pointer transition"
              title="Location"
            >
              <MapPinIcon className="w-5 h-5" />
              <span className="text-sm hidden md:inline">Location</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotificationToggle}
                className="p-2 rounded-full hover:bg-green-100 transition relative"
                title="Notifications"
              >
                <BellIcon className="w-6 h-6 text-green-700" />
                {orderNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {orderNotificationCount > 9 ? '9+' : orderNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown - Only show when authenticated */}
              {isAuthenticated && isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Order Notifications</h3>
                    {orderNotifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                        title="Clear all notifications"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {orderNotifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      orderNotifications.map((notification) => {
                        const order = notificationOrders[notification.order_id];
                        const isExpanded = expandedNotification === notification.id;
                        
                        return (
                          <div
                            key={notification.id}
                            className={`border-b border-gray-100 ${
                              !notification.is_read ? 'bg-blue-50' : 'bg-white'
                            }`}
                          >
                            <div
                              onClick={() => handleNotificationClick(notification)}
                              className="p-4 hover:bg-gray-50 cursor-pointer"
                            >
                              <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-800'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                                <div className="flex items-center gap-2">
                                  {notification.order_id && (
                                    <button
                                      onClick={(e) => handleViewMore(notification, e)}
                                      className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-green-50 transition"
                                    >
                                      {isExpanded ? 'View Less' : 'View More'}
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                                    title="Delete notification"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded Order Details */}
                            {isExpanded && notification.order_id && (
                              <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                                {order ? (
                                  <div className="space-y-3 pt-3">
                                    {/* Order Items */}
                                    {order.items && order.items.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Items:</h4>
                                        <div className="space-y-2">
                                          {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                                              <span className="text-gray-700">
                                                {item.product?.name || item.product_name || `Item ${idx + 1}`}
                                                <span className="text-gray-500 ml-1">(Qty: {item.quantity})</span>
                                              </span>
                                              <span className="font-medium text-gray-800">
                                                ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Total Amount */}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                      <span className="text-xs font-semibold text-gray-700">Total Amount:</span>
                                      <span className="text-sm font-bold text-green-600">
                                        ₹{typeof order.total_amount === 'number'
                                          ? order.total_amount.toFixed(2)
                                          : order.total_amount}
                                      </span>
                                    </div>
                                    
                                    {/* Shipping Address */}
                                    {order.shipping_address && (
                                      <div className="pt-2 border-t border-gray-200">
                                        <h4 className="text-xs font-semibold text-gray-700 mb-1">Delivery Address:</h4>
                                        <p className="text-xs text-gray-600 whitespace-pre-line">
                                          {order.shipping_address}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div className="space-y-2 mt-3">
                                      <button
                                        onClick={() => handleViewFullOrder(notification.order_id)}
                                        className="w-full px-3 py-2 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
                                      >
                                        View Full Order
                                      </button>
                                      
                                      {/* Report Issue Button - Only for delivered orders */}
                                      {order.status?.toLowerCase() === 'delivered' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setReportModal({ show: true, orderId: order.id });
                                          }}
                                          className="w-full px-3 py-2 text-xs font-medium border border-red-600 text-red-600 rounded hover:bg-red-50 transition flex items-center justify-center gap-1"
                                        >
                                          <ExclamationTriangleIcon className="w-3 h-3" />
                                          Report Issue
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-2 text-xs text-gray-500 text-center">
                                    Loading order details...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {orderNotifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          navigate('/orders');
                          setIsNotificationOpen(false);
                        }}
                        className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        View All Orders
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={handleCartClick}
              className="p-2 rounded-full hover:bg-green-100 transition relative"
              title="Shopping Cart"
            >
              <ShoppingCartIcon className="w-6 h-6 text-green-700" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Profile or Login Button */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-100 transition"
                title={isAuthenticated ? "Profile Menu" : "Login"}
              >
                <UserIcon className="w-6 h-6 text-green-700" />
                <span className="text-sm hidden sm:inline text-gray-700 font-medium">
                  {isAuthenticated ? (user?.name || 'User') : 'Login'}
                </span>
              </button>

              {/* Profile Dropdown Menu - Only show when authenticated */}
              {isAuthenticated && isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {/* User Info or Login Prompt */}
                  <div className="p-4 border-b border-gray-200 bg-green-50">
                    {user ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-700">Please login to your account</p>
                    )}
                  </div>

                  {/* Menu Items - Only show if logged in */}
                  {user ? (
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          navigate('/cart');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                        My Cart
                      </button>

                      <button
                        onClick={() => {
                          navigate('/orders');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                      >
                        <ShoppingBagIcon className="w-4 h-4" />
                        My Orders
                      </button>

                      <button
                        onClick={() => {
                          navigate('/chat');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 relative"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        Messages
                        {unreadCount > 0 && (
                          <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                      >
                        <MapPinIcon className="w-4 h-4" />
                        My Addresses
                      </button>
                    </div>
                  ) : null}

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Login/Signup or Logout */}
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                    >
                      Logout
                    </button>
                  ) : (
                    <div className="py-2 space-y-1">
                      <button
                        onClick={() => {
                          navigate('/login');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-medium"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          navigate('/signup');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="lg:hidden mt-4 flex flex-wrap gap-3 border-t border-gray-200 pt-4">
          <button
            onClick={() => navigate('/customer-dashboard')}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 font-medium px-2 py-1 rounded hover:bg-green-50"
          >
            <HomeIcon className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 font-medium px-2 py-1 rounded hover:bg-green-50"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Browse
          </button>

          <button
            onClick={handleChatClick}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 font-medium px-2 py-1 rounded hover:bg-green-50 relative"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Messages
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
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

      {/* Report Issue Modal */}
      {reportModal.show && (
        <ReportIssueModal
          isOpen={reportModal.show}
          onClose={() => setReportModal({ show: false, orderId: null })}
          onSubmit={handleReportIssue}
          orderId={reportModal.orderId}
        />
      )}
    </div>
  );
}

export default CustomerNavbar;
