import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL, messagingAPI } from "../services/api";

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const [groupChatActivityCount, setGroupChatActivityCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user');
    navigate("/admin-login");
  };

  const isActive = (path) => location.pathname === path ? "text-white bg-green-700" : "text-gray-200 hover:bg-green-600";

  const loadPendingComplaintsCount = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/complaints?status_filter=pending`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const complaints = await response.json();
        setPendingComplaintsCount(Array.isArray(complaints) ? complaints.length : 0);
      }
    } catch (err) {
      // Backend may be down or connection reset; don't break the navbar
      console.debug('Failed to load pending complaints count:', err);
    }
  };

  const loadGroupChatActivityCount = async () => {
    try {
      const data = await messagingAPI.getDefaultFarmerGroupActivityCount();
      setGroupChatActivityCount(data?.count ?? 0);
    } catch (err) {
      console.debug('Failed to load group chat activity count:', err);
    }
  };

  useEffect(() => {
    loadPendingComplaintsCount();
    loadGroupChatActivityCount();
    const cInterval = setInterval(loadPendingComplaintsCount, 30000);
    const gInterval = setInterval(loadGroupChatActivityCount, 30000);
    const onGroupChatSeen = () => loadGroupChatActivityCount();
    const onComplaintsUpdated = () => loadPendingComplaintsCount();
    window.addEventListener("groupChatSeen", onGroupChatSeen);
    window.addEventListener("complaintsUpdated", onComplaintsUpdated);
    return () => {
      clearInterval(cInterval);
      clearInterval(gInterval);
      window.removeEventListener("groupChatSeen", onGroupChatSeen);
      window.removeEventListener("complaintsUpdated", onComplaintsUpdated);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin-complaints') loadPendingComplaintsCount();
    if (location.pathname === '/chat' || location.pathname === '/admin-chat') loadGroupChatActivityCount();
  }, [location.pathname]);

  const goToMessagesToFarmers = () => navigate('/admin-chat');
  const goToFreeToAskChat = () => navigate('/chat?group=free-to-ask');

  return (
    <nav className="bg-green-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-white font-bold text-xl cursor-pointer" onClick={() => navigate("/admin-dashboard")}>
              🌾 KisanConnect Admin
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-1">
            <button
              onClick={() => navigate("/admin-dashboard")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/admin-dashboard")}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/admin-users")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/admin-users")}`}
            >
              Users
            </button>
            <button
              onClick={() => navigate("/admin-farmers")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/admin-farmers")}`}
            >
              Farmers
            </button>
            <button
              onClick={() => navigate("/admin-orders")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/admin-orders")}`}
            >
              Orders
            </button>
            <button
              onClick={() => navigate("/market-prices")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/market-prices")}`}
            >
              <span className="flex items-center gap-1">
                <ChartBarIcon className="w-4 h-4" />
                Market Prices
              </span>
            </button>
            <button
              onClick={goToMessagesToFarmers}
              className={`px-3 py-2 rounded-md text-sm font-medium relative ${(location.pathname === "/admin-chat" || location.pathname === "/chat") ? "text-white bg-green-700" : "text-gray-200 hover:bg-green-600"}`}
            >
              <span className="flex items-center gap-2">
                💬 Messages to Farmers
              </span>
              {groupChatActivityCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {groupChatActivityCount > 9 ? '9+' : groupChatActivityCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/admin-complaints")}
              className={`px-3 py-2 rounded-md text-sm font-medium relative ${isActive("/admin-complaints")}`}
            >
              <span className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Complaints
              </span>
              {pendingComplaintsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingComplaintsCount > 9 ? '9+' : pendingComplaintsCount}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-white hover:bg-green-700 inline-flex items-center justify-center p-2 rounded-md text-base font-medium"
            >
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden pb-4">
            <button
              onClick={() => {
                navigate("/admin-dashboard");
                setShowMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${isActive("/admin-dashboard")}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                navigate("/admin-users");
                setShowMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${isActive("/admin-users")}`}
            >
              Users
            </button>
            <button
              onClick={() => {
                navigate("/admin-farmers");
                setShowMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${isActive("/admin-farmers")}`}
            >
              Farmers
            </button>
            <button
              onClick={() => {
                navigate("/admin-orders");
                setShowMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${isActive("/admin-orders")}`}
            >
              Orders
            </button>
            <button
              onClick={() => {
                navigate("/market-prices");
                setShowMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${isActive("/market-prices")}`}
            >
              <span className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Market Prices
              </span>
            </button>
            <button
              onClick={() => {
                goToMessagesToFarmers();
                setShowMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium relative ${(location.pathname === "/admin-chat" || location.pathname === "/chat") ? "text-white bg-green-700" : "text-gray-200 hover:bg-green-600"}`}
            >
              <span className="flex items-center gap-2">
                💬 Messages to Farmers
                {groupChatActivityCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {groupChatActivityCount > 9 ? '9+' : groupChatActivityCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => {
                navigate("/admin-complaints");
                setShowMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium relative ${isActive("/admin-complaints")}`}
            >
              <span className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Complaints
                {pendingComplaintsCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingComplaintsCount > 9 ? '9+' : pendingComplaintsCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default AdminNavbar;
