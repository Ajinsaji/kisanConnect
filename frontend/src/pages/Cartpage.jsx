import { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CustomerNavbar from "../components/CustomerNavbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { cartAPI } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const loadCart = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await cartAPI.get();
      setCart(data);
    } catch (err) {
      setError(err.message || "Failed to load cart");
      console.error("Error loading cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please login to view your cart', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (user?.role !== 'buyer') {
      showToast('Only buyers can access the cart', 'warning');
      setTimeout(() => navigate('/'), 1500);
      return;
    }
    loadCart();
  }, [isAuthenticated, user, navigate, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'buyer') return;
    const onVisible = () => { if (document.visibilityState === 'visible') loadCart(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isAuthenticated, user?.role]);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdating({ ...updating, [itemId]: true });
    try {
      await cartAPI.update(itemId, newQuantity);
      await loadCart(); // Reload cart
    } catch (err) {
      const errorMessage = err.message || "Failed to update quantity";
      showToast(errorMessage, "error");
    } finally {
      setUpdating({ ...updating, [itemId]: false });
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      await loadCart(); // Reload cart
      showToast("Item removed from cart", "success");
    } catch (err) {
      const errorMessage = err.message || "Failed to remove item";
      showToast(errorMessage, "error");
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      showToast("Your cart is empty", "warning");
      return;
    }

    // Navigate to checkout page
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-light">
        <CustomerNavbar title="Your Cart" cartCount={0} />
        <div className="mx-14 px-5 py-8">
          <p className="text-center py-10">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-light">
        <CustomerNavbar title="Your Cart" cartCount={0} />
        <div className="mx-14 px-5 py-8">
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];

  return (
    <>
      <div className="w-full min-h-screen bg-light">
        <CustomerNavbar title="Your Cart" cartCount={cartItems.length} />

        <div className="mx-14 px-5 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/customer-dashboard")}
            className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="grid grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="col-span-8 bg-white border border-green-200 rounded-lg shadow-sm">
              {/* Header */}
              <div className="px-6 py-4 border-b bg-primaryDark text-white rounded-t-lg">
                <h1 className="text-xl font-semibold">Shopping Cart</h1>
              </div>

              {/* Items */}
              {cartItems.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  Your cart is empty
                </div>
              ) : (
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-6 p-6">
                      {/* Image */}
                      <img
                        src={item.product.image_url && !item.product.image_url.startsWith('blob:')
                          ? item.product.image_url
                          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect fill='%23e5e7eb' width='96' height='96'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"}
                        alt={item.product.name}
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect fill='%23e5e7eb' width='96' height='96'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                        className="w-24 h-24 object-cover rounded-md border"
                      />

                      {/* Details */}
                      <div className="flex-1">
                        <h2 className="text-lg font-medium text-gray-800">
                          {item.product.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {item.product.category || "Product"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          ₹{(typeof (item.product.effective_price ?? item.product.price) === 'number'
                            ? (item.product.effective_price ?? item.product.price).toFixed(2)
                            : (item.product.effective_price ?? item.product.price))} per kg
                          {item.product.effective_price != null && (
                            <span className="ml-1 text-amber-600 text-xs">(special offer)</span>
                          )}
                        </p>

                        <div className="mt-3 flex items-center gap-4">
                          {/* Quantity */}
                          <div className="flex items-center border rounded-md">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={updating[item.id]}
                              className="px-3 py-1 text-lg disabled:opacity-50"
                            >
                              −
                            </button>
                            <span className="px-4">
                              {updating[item.id] ? "..." : item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={updating[item.id]}
                              className="px-3 py-1 text-lg disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-lg font-semibold text-primaryDark">
                        ₹{(
                          (typeof (item.product.effective_price ?? item.product.price) === 'number'
                            ? (item.product.effective_price ?? item.product.price)
                            : parseFloat(item.product.effective_price ?? item.product.price)
                          ) * item.quantity
                        ).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="col-span-4 bg-white border border-green-200 rounded-lg shadow-sm h-fit">
              <div className="px-6 py-4 bg-primaryDark text-white rounded-t-lg">
                <h2 className="text-lg font-semibold">Order Summary</h2>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{cart?.total_amount?.toFixed(2) || "0.00"}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>

                <hr />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primaryDark">
                    ₹{cart?.total_amount?.toFixed(2) || "0.00"}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!cart || cart.items.length === 0}
                  className="btn-primary-sm py-4 w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />

        {toast.show && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            duration={3000}
            position="center"
            onClose={() => setToast({ show: false, message: "", type: "info" })}
          />
        )}
      </div>
    </>
  );
}

export default Cart;
