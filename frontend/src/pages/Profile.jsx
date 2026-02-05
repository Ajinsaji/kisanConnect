import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI, cartAPI, adminSettingsAPI } from "../services/api";
import CustomerNavbar from "../components/CustomerNavbar";
import FarmerNavbar from "../components/FarmerNavbar";
import AdminNavbar from "../components/AdminNavbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

function Profile() {
  const { user, loading, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState("");
  const [newsEnabled, setNewsEnabled] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [togglingActive, setTogglingActive] = useState(false);

  useEffect(() => {
    if (user) {
      setUserData(user);
      setFormData(user);
    }
  }, [user]);

  useEffect(() => {
    const loadCart = async () => {
      // Only load cart for buyers
      if (user?.role !== 'buyer') {
        setCartCount(0);
        return;
      }
      try {
        const data = await cartAPI.get();
        setCartCount(data?.items?.length || 0);
      } catch {
        setCartCount(0);
      }
    };
    if (user) {
      loadCart();
      // Load news settings for admin
      if (user.role === 'admin') {
        loadNewsSettings();
      }
    }
  }, [user]);

  const loadNewsSettings = async () => {
    try {
      const response = await adminSettingsAPI.getNewsSettings();
      setNewsEnabled(response.news_enabled);
    } catch (err) {
      console.error("Error loading news settings:", err);
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

  const handleSaveProfile = async () => {
    try {
      setError("");
      const updated = await userAPI.updateProfile(formData);
      setUserData(updated);
      updateUser(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  const handleToggleActive = async () => {
    try {
      setTogglingActive(true);
      setError("");
      const updated = await userAPI.toggleActiveStatus();
      setUserData(updated);
      updateUser(updated);
      setToast({
        show: true,
        message: updated.is_active
          ? "You are now visible to customers. Your products will appear in listings."
          : "You are now inactive. Your products are hidden from customers.",
        type: "success",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    } catch (err) {
      setToast({
        show: true,
        message: err.message || "Failed to update visibility",
        type: "error",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    } finally {
      setTogglingActive(false);
    }
  };

  // Determine which navbar to use based on user role
  const isFarmer = user?.role === "farmer";
  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f7f4]">
        {isAdmin ? (
          <AdminNavbar />
        ) : isFarmer ? (
          <FarmerNavbar activeTab="profile" />
        ) : (
          <CustomerNavbar title="My Profile" cartCount={cartCount} />
        )}
        <p className="text-center py-24 text-gray-600">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7f4] flex flex-col">
      {isAdmin ? (
        <AdminNavbar />
      ) : isFarmer ? (
        <FarmerNavbar activeTab="profile" />
      ) : (
        <CustomerNavbar title="My Profile" cartCount={cartCount} />
      )}

      {/* FULL-WIDTH CONTAINER */}
      <div className={`flex-1 max-w-7xl mx-auto px-6 py-10 ${isFarmer ? "md:ml-64" : ""}`}>
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-green-700 hover:underline mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        {/* BIG PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl border border-green-200 overflow-hidden"
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-10 py-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold">
                  {userData?.name || "Customer"}
                </h1>
                <p className="text-green-100 mt-1 capitalize">
                  {userData?.role} account
                </p>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white text-green-700 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition"
                >
                  <PencilIcon className="w-5 h-5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* CONTENT */}
          <div className="px-10 py-8">
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {[
                  ["Email", "email"],
                  ["Full Name", "name"],
                  ["Phone Number", "phone"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-sm font-semibold text-gray-700">
                      {label}
                    </label>
                    {isEditing ? (
                      <input
                        value={formData?.[key] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        className="mt-2 w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-2 text-gray-600">
                        {userData?.[key] || "Not provided"}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                {[
                  ["Address", "address"],
                  ["City", "city"],
                  ["State", "state"],
                  ["Postal Code", "postal_code"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-sm font-semibold text-gray-700">
                      {label}
                    </label>
                    {isEditing ? (
                      <input
                        value={formData?.[key] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        className="mt-2 w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-2 text-gray-600">
                        {userData?.[key] || "Not provided"}
                      </p>
                    )}
                  </div>
                ))}

                <div className="bg-green-50 p-5 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700">
                    Account Type
                  </p>
                  <p className="text-gray-600 capitalize">
                    {userData?.role === "farmer"
                      ? "Farmer Account"
                      : userData?.role === "admin"
                      ? "Admin Account"
                      : "Customer Account"}
                  </p>
                </div>
              </div>
            </div>

            {/* FARMER: SELLER VISIBILITY (ACTIVE / INACTIVE) */}
            {isFarmer && (
              <div className="mt-10 pt-8 border-t">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Seller visibility</h2>
                {userData?.deactivated_by_admin ? (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                      <XCircleIcon className="w-8 h-8 text-amber-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-amber-800">
                          Your account is inactive. Please contact support.
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Your account was deactivated by an administrator. You cannot change visibility until support reactivates your account.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {userData?.is_active !== false ? (
                          <CheckCircleIcon className="w-8 h-8 text-green-600" />
                        ) : (
                          <XCircleIcon className="w-8 h-8 text-gray-400" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {userData?.is_active !== false ? "Active" : "Inactive"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {userData?.is_active !== false
                              ? "Your products are visible to customers."
                              : "Your products are hidden from customers. You can set yourself active again anytime."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleActive}
                        disabled={togglingActive}
                        className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap ${
                          userData?.is_active !== false
                            ? "bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                            : "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        }`}
                      >
                        {togglingActive ? (
                          "Updating…"
                        ) : userData?.is_active !== false ? (
                          <>
                            <XCircleIcon className="w-5 h-5" />
                            Set inactive
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            Set active
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADMIN SETTINGS SECTION */}
            {isAdmin && (
              <div className="mt-10 pt-8 border-t">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Settings</h2>
                
                {/* Government News Notification Toggle */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {newsEnabled ? (
                        <SpeakerWaveIcon className="w-8 h-8 text-green-600" />
                      ) : (
                        <SpeakerXMarkIcon className="w-8 h-8 text-gray-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Government News Notifications
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {newsEnabled 
                            ? "Notifications are currently enabled for all users" 
                            : "Notifications are currently muted - users won't see government news"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleNews}
                      className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
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
                </div>
              </div>
            )}

            {/* ACTIONS */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-6 mt-10"
              >
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(userData);
                  }}
                  className="flex-1 py-4 bg-gray-300 rounded-xl font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* LOGOUT */}
            <div className="mt-10 pt-8 border-t space-y-4">
              {/* Only show "My Orders" button for buyers */}
              {!isFarmer && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/orders')}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  My Orders
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={logout}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6 inline mr-2" />
                Logout
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />

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

export default Profile;
