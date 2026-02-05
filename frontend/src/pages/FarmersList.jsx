import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import CustomerNavbar from "../components/CustomerNavbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import RatingStars from "../components/RatingStars";
import { productsAPI, cartAPI, messagingAPI, ratingsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function FarmersList() {
  const { productName } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [farmerRatings, setFarmerRatings] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    loadFarmers();
    if (isAuthenticated) loadCartCount();
  }, [productName, isAuthenticated]);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      setError("");
      // Fetch all products and filter by product name
      const allProducts = await productsAPI.list();
      // Filter products that match the product name (case-insensitive)
      const matchingProducts = allProducts.filter(
        (p) => p.name.toLowerCase() === decodeURIComponent(productName).toLowerCase()
      );
      
      // Group products by farmer (since we don't have farmer details in product)
      // Each product has a farmer_id, but we'll show products as "farmer products"
      setFarmers(matchingProducts);
      
      // Load ratings for each farmer
      const uniqueFarmerIds = [...new Set(matchingProducts.map(p => p.farmer_id))];
      const ratingsData = {};
      for (const farmerId of uniqueFarmerIds) {
        try {
          const ratingData = await ratingsAPI.getFarmerRatings(farmerId);
          ratingsData[farmerId] = ratingData;
        } catch (err) {
          // Farmer might not have ratings yet, that's okay
          ratingsData[farmerId] = { average_rating: 0, total_ratings: 0, ratings: [] };
        }
      }
      setFarmerRatings(ratingsData);
    } catch (err) {
      setError("Failed to load farmers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const cart = await cartAPI.get();
      setCartCount(cart?.items?.length || 0);
    } catch {}
  };

  const showToast = (msg, type = "info") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      showToast("Please login to add items", "warning");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }

    try {
      await cartAPI.add(productId, 1);
      showToast("Added to cart", "success");
      loadCartCount();
    } catch {
      showToast("Failed to add to cart", "error");
    }
  };

  const handleChatWithFarmer = async (farmerId) => {
    if (!isAuthenticated) {
      showToast("Please login to chat with farmers", "warning");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }

    try {
      // Create or get conversation with the farmer
      const conversation = await messagingAPI.getOrCreateConversation(farmerId);
      // Navigate to chat page with the conversation ID
      navigate(`/chat?conversation_id=${conversation.id}`);
    } catch (err) {
      showToast(err.message || "Failed to start chat", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7f6]">
        <CustomerNavbar title="Farmers" cartCount={cartCount} />
        <p className="text-center py-32 text-gray-600">Loading farmers...</p>
      </div>
    );
  }

  const decodedProductName = decodeURIComponent(productName || "");
  const capitalizedName = decodedProductName.charAt(0).toUpperCase() + decodedProductName.slice(1);

  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      <CustomerNavbar title={`${capitalizedName} - Farmers`} cartCount={cartCount} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/customer-dashboard")}
            className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-4 font-medium transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Explore Fresh {capitalizedName}
          </h1>
          <p className="text-gray-600">
            Choose from {farmers.length} farmer{farmers.length !== 1 ? "s" : ""} offering {capitalizedName}
          </p>
        </div>

        {error ? (
          <div className="text-center py-20">
            <p className="text-red-600">{error}</p>
          </div>
        ) : farmers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">No farmers found selling {capitalizedName}</p>
            <button
              onClick={() => navigate("/customer-dashboard")}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Browse Other Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {farmers.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow border border-green-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={product.image_url && !product.image_url.startsWith('blob:')
                        ? product.image_url 
                        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"}
                      alt={product.name}
                      className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl"
                      onError={(e) => {
                        // If image fails to load, use data URI placeholder
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {product.name}
                    </h3>
                    {product.category && (
                      <p className="text-sm text-gray-500 mb-3 capitalize">
                        Category: {product.category}
                      </p>
                    )}
                    {product.description && (
                      <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-lg font-bold text-green-700">
                          ₹{product.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">per kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Available Stock</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {product.quantity} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Farmer ID</p>
                        <p className="text-sm font-medium text-gray-600">
                          FC-{product.farmer_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Rating</p>
                        {farmerRatings[product.farmer_id]?.average_rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <RatingStars 
                              rating={farmerRatings[product.farmer_id].average_rating} 
                              size="sm"
                            />
                            <span className="text-xs text-gray-600">
                              ({farmerRatings[product.farmer_id].total_ratings})
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-400">No ratings yet</p>
                        )}
                      </div>
                    </div>

                    {/* Ratings/Comments Section */}
                    {farmerRatings[product.farmer_id]?.ratings && 
                     farmerRatings[product.farmer_id].ratings.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <button
                          onClick={() => setExpandedComments(prev => ({
                            ...prev,
                            [product.id]: !prev[product.id]
                          }))}
                          className="flex items-center justify-between w-full text-left text-sm font-medium text-green-700 hover:text-green-800 transition"
                        >
                          <span>
                            View All Comments ({farmerRatings[product.farmer_id].ratings.length})
                          </span>
                          <span className="text-xs">
                            {expandedComments[product.id] ? '▲' : '▼'}
                          </span>
                        </button>
                        
                        {expandedComments[product.id] && (
                          <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                            {farmerRatings[product.farmer_id].ratings.map((rating) => (
                              <div
                                key={rating.id}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800 text-sm">
                                      {rating.user_name || 'Anonymous'}
                                    </p>
                                    <div className="flex items-center">
                                      <RatingStars rating={rating.rating} size="sm" />
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {new Date(rating.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {rating.comment && (
                                  <p className="text-sm text-gray-700 mt-2 italic">
                                    "{rating.comment}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4 flex-wrap">
                      <button
                        onClick={() => handleViewProduct(product.id)}
                        className="px-6 py-2 border border-green-600 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.quantity === 0}
                        className={`px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition ${
                          product.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                      <button
                        onClick={() => handleChatWithFarmer(product.farmer_id)}
                        className="px-6 py-2 border border-blue-600 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition flex items-center gap-2"
                      >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        Chat with Farmer
                      </button>
                      <button
                        onClick={() => navigate(`/negotiate/${product.id}`)}
                        disabled={product.quantity === 0}
                        className="px-6 py-2 border border-amber-600 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition flex items-center gap-2 disabled:opacity-50"
                      >
                        Negotiate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="center"
          onClose={() => setToast({ show: false })}
        />
      )}
    </div>
  );
}

export default FarmersList;
