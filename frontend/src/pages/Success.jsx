import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ordersAPI } from "../services/api";

function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await ordersAPI.get(parseInt(orderId));
      setOrder(data);
    } catch (error) {
      console.error("Failed to load order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen bg-light">
        <Navbar title="Order Confirmation" />

        <div className="mx-14 px-5 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-green-200 rounded-lg shadow-sm p-8 text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                Order Placed Successfully!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your order. We've received your order and will process it soon.
              </p>

              {/* Order Details */}
              {order && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Order Details
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{order.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-primaryDark">
                        ₹{typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : order.total_amount}
                      </span>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-gray-600 mb-2">Items:</p>
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm py-1"
                          >
                            <span>{item.product?.name || `Product ${item.product_id}`} x {item.quantity}</span>
                            <span>₹{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2 border border-primaryDark text-primaryDark rounded-lg hover:bg-green-50 transition"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate("/customer-dashboard")}
                  className="px-6 py-2 bg-primaryDark text-white rounded-lg hover:bg-primary transition"
                >
                  View My Orders
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

export default Success;
