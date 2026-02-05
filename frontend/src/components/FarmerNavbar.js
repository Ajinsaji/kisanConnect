import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { messagingAPI, ordersAPI } from "../services/api";
import Toast from "./Toast";

function FarmerNavbar({ activeTab = "dashboard" }) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState([]);
  const [orderNotificationCount, setOrderNotificationCount] = useState(0);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [notificationOrders, setNotificationOrders] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const navItems = [
    { id: "dashboard", label: "Dashboard", path: "/farmer-dashboard", icon: HomeIcon },
    { id: "products", label: "Products", path: "/inventory", icon: ShoppingBagIcon },
    { id: "orders", label: "Orders", path: "/farmer-orders", icon: ClipboardDocumentListIcon },
    { id: "earnings", label: "Earnings", path: "/earnings", icon: BanknotesIcon },
    { id: "market-prices", label: "Market Prices", path: "/market-prices", icon: ChartBarIcon },
    { id: "messages", label: "Messages", path: "/chat", icon: ChatBubbleLeftRightIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const loadUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setAdminUnreadCount(0);
      return;
    }
    try {
      const data = await messagingAPI.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
      
      // Also load admin messages unread count
      try {
        const adminData = await messagingAPI.getAdminMessagesUnreadCount();
        setAdminUnreadCount(adminData.unread_count || 0);
      } catch (err) {
        console.error('Failed to load admin unread count:', err);
      }
    } catch (err) {
      console.error('Failed to load unread count:', err);
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
      console.error('Failed to load order notifications:', err);
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

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await ordersAPI.deleteNotification(notificationId);
      await loadOrderNotifications();
      setToast({ show: true, message: 'Notification deleted successfully', type: 'success' });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed to delete notification', type: 'error' });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
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
      setToast({ show: true, message: 'All notifications cleared successfully', type: 'success' });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed to clear notifications', type: 'error' });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
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
    <>
      {/* Left Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div 
            className="text-2xl font-bold text-green-700 cursor-pointer flex items-center gap-2" 
            onClick={() => navigate("/farmer-dashboard")}
          >
            <span className="text-3xl">🌾</span>
            <span>KisanConnect</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isMessages = item.id === "messages";
              const isOrders = item.id === "orders";
              const badge = isMessages
                ? (unreadCount + adminUnreadCount)
                : isOrders
                  ? orderNotificationCount
                  : 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add Product Button */}
          <div className="mt-6 px-2">
            <button
              onClick={() => navigate("/register-product")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
            >
              <span className="text-lg">+</span>
              <span>Add Product</span>
            </button>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <UserCircleIcon className="w-10 h-10 text-green-700 flex-shrink-0" />
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || "Profile"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Bars3Icon className="w-4 h-4 text-gray-400" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    navigate("/profile");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <UserCircleIcon className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200 transition flex items-center gap-2"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Top Bar - Mobile + Notifications */}
      <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="text-xl font-bold text-green-700 cursor-pointer flex items-center gap-1" onClick={() => navigate("/farmer-dashboard")}>
                <span>🌾</span>
                <span>KisanConnect</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
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
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6 text-gray-700" />
                ) : (
                  <Bars3Icon className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="pb-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isMessages = item.id === "messages";
                const isOrders = item.id === "orders";
                const badge = isMessages
                  ? (unreadCount + adminUnreadCount)
                  : isOrders
                    ? orderNotificationCount
                    : 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition relative ${
                      isActive
                        ? "bg-green-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  navigate("/register-product");
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
              >
                <span>+</span>
                <span>Add Product</span>
              </button>
              
              {/* User Profile in Mobile */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 px-4 py-2 mb-2">
                  <UserCircleIcon className="w-10 h-10 text-green-700" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{user?.name || "Profile"}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Notification Dropdown - For both mobile and desktop */}
      {isAuthenticated && isNotificationOpen && (
        <div className="fixed top-20 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[70vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
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
          <div className="overflow-y-auto flex-1">
            {orderNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              orderNotifications.map((notification) => {
                const order = notificationOrders[notification.order_id];
                const isExpanded = expandedNotification === notification.id;
                const isComplaintMessage = notification.message?.includes("complaint against you") || 
                                          notification.message?.includes("Kisan Connect team");
                
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
                      <div className="flex items-start gap-2">
                        {isComplaintMessage && (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
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
                            
                            {/* Customer Info */}
                            {order.buyer && (
                              <div className="pt-2 border-t border-gray-200">
                                <h4 className="text-xs font-semibold text-gray-700 mb-1">Customer:</h4>
                                <p className="text-xs text-gray-600">{order.buyer.name || order.buyer.email}</p>
                              </div>
                            )}
                            
                            {/* Action Button */}
                            <button
                              onClick={() => {
                                navigate(`/farmer-order/${notification.order_id}`);
                                setIsNotificationOpen(false);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition mt-2"
                            >
                              View Full Order
                            </button>
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
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  navigate('/farmer-orders');
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

      {/* Overlay for notification dropdown */}
      {isNotificationOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsNotificationOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-center"
          onClose={() => setToast({ show: false, message: "", type: "info" })}
        />
      )}
    </>
  );
}

export default FarmerNavbar;
