import React, { useState, useEffect, useCallback } from "react";
import CustomerNavbar from "../components/CustomerNavbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { dashboardAPI, productsAPI, isTimeLockError } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingBagIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Redirect admin and farmer users to their respective dashboards
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'farmer') {
        navigate('/farmer-dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Load authenticated user dashboard data
  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    // Only load buyer dashboard if user is a buyer
    if (user?.role !== 'buyer') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const data = await dashboardAPI.buyer();
      setDashboardData(data);
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("Unauthorized") || err.message.includes("403") || err.message.includes("Forbidden")) {
        setDashboardData(null);
      } else {
        setError(err.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load all products (public data)
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const data = await productsAPI.list();
      setProducts(data || []);
    } catch (err) {
      if (!isTimeLockError(err)) console.error("Failed to load products:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadDashboard();
      loadProducts();
    }
  }, [authLoading, loadDashboard, loadProducts]);

  const stats = dashboardData?.statistics || {};
  const cartCount = stats.cart_items || 0;

  // Group products by name
  const groupedProducts = products.reduce((acc, product) => {
    const name = product.name.toLowerCase();
    if (!acc[name]) {
      acc[name] = {
        name: product.name,
        products: [],
        image: product.image_url,
        category: product.category,
      };
    }
    acc[name].products.push(product);
    return acc;
  }, {});

  const productCategories = Object.values(groupedProducts);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f3f7f4]">
        <CustomerNavbar title="Dashboard" cartCount={0} />
        <p className="text-center py-24 text-gray-600">
          Loading your shopping space…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7f4]">
      <CustomerNavbar title="Dashboard" cartCount={cartCount} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HERO / WELCOME */}
        <div className="mb-10 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-10 text-white flex flex-col md:flex-row justify-between items-center">
          <div>
            {isAuthenticated ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold">
                  Welcome back, {dashboardData?.user?.name || user?.name || "Customer"} 👋
                </h1>
                <p className="text-green-100 mt-2 text-lg">
                  Fresh farm products, delivered to your doorstep
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold">
                  Welcome to Kissan Connect 👋
                </h1>
                <p className="text-green-100 mt-2 text-lg">
                  Fresh farm products, delivered to your doorstep. Login to place orders and track deliveries!
                </p>
              </>
            )}
          </div>

          <div className="mt-6 md:mt-0 flex gap-4">
            <button
              onClick={() => navigate("/")}
              className="px-8 py-4 bg-white text-green-700 rounded-xl font-semibold hover:bg-green-50 transition"
            >
              🛍️ Browse Products
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 bg-white text-green-700 rounded-xl font-semibold hover:bg-green-50 transition"
              >
                🔑 Login
              </button>
            )}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setToastMessage('Please login to continue');
                  setShowToast(true);
                } else {
                  navigate("/cart");
                }
              }}
              className="px-8 py-4 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 transition"
            >
              🛒 Cart ({cartCount})
            </button>
          </div>
        </div>

        {/* STATS - Only show for authenticated users */}
        {isAuthenticated && dashboardData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <EcomStat
              icon={<ShoppingBagIcon className="w-8 h-8 text-green-600" />}
              label="Total Orders"
              value={stats.total_orders || 0}
            />
            <EcomStat
              icon={<CurrencyRupeeIcon className="w-8 h-8 text-blue-600" />}
              label="Total Spent"
              value={`₹${stats.total_spent?.toFixed(2) || "0.00"}`}
            />
            <EcomStat
              icon={<ShoppingCartIcon className="w-8 h-8 text-orange-600" />}
              label="Items in Cart"
              value={stats.cart_items || 0}
            />
          </div>
        )}

        {/* PRODUCTS SECTION - Available for all users */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isAuthenticated ? "Recommended for You" : "Browse Fresh Farm Products"}
          </h2>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-green-700 hover:underline"
          >
            View all products
          </button>
        </div>

        {productsLoading ? (
          <p className="text-center text-gray-600 py-20">
            Loading products…
          </p>
        ) : productCategories.length === 0 ? (
          <p className="text-center text-gray-600 py-20">
            No products available
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productCategories.map((category) => (
              <div
                key={category.name}
                onClick={() => navigate(`/farmers/${encodeURIComponent(category.name)}`)}
                className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:scale-105 transform duration-200"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-50">
                  <img
                    src={category.image && !category.image.startsWith('blob:') 
                      ? category.image 
                      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23d1fae5' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%23059669' text-anchor='middle' dy='.3em'%3EFresh Product%3C/text%3E%3C/svg%3E"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, use data URI placeholder
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23d1fae5' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%23059669' text-anchor='middle' dy='.3em'%3EFresh Product%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {category.category && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full capitalize">
                        {category.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Explore and get fresh {category.name.toLowerCase()} from {category.products.length} farmer{category.products.length !== 1 ? "s" : ""}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Available from</p>
                      <p className="text-lg font-semibold text-green-700">
                        {category.products.length} Farmer{category.products.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Starting from</p>
                      <p className="text-lg font-bold text-green-700">
                        ₹{Math.min(...category.products.map(p => p.price)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/farmers/${encodeURIComponent(category.name)}`);
                    }}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition text-sm"
                  >
                    Explore Options →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          position="center"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

export default CustomerDashboard;

/* ===== ECOMMERCE STAT CARD ===== */
function EcomStat({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow border border-gray-200 flex items-center gap-4">
      <div className="p-3 bg-gray-100 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
