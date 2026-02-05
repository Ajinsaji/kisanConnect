import { useAuth } from "../context/AuthContext";
import { cartAPI } from "../services/api";
import { getFileUrl } from "../config";
import { useState } from "react";
import Toast from "./Toast";

function ProductCard({ product, onLoginRequired }) {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setToastMessage("Please login to continue");
      setShowToast(true);
      if (onLoginRequired) onLoginRequired();
      return;
    }

    if (user?.role !== "buyer") {
      setToastMessage("Only customers can add items to cart");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await cartAPI.add(product.id, 1);
      setToastMessage("Product added to cart!");
      setShowToast(true);
    } catch (error) {
      setToastMessage(error.message || "Failed to add product to cart");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle image fallback - filter out blob URLs
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='230' height='230'%3E%3Crect fill='%23e5e7eb' width='230' height='230'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  const rawUrl = product.image_url && !product.image_url.startsWith('blob:') ? product.image_url : null;
  const imageUrl = rawUrl ? (rawUrl.startsWith('/') ? getFileUrl(rawUrl) : rawUrl) : placeholderImage;
  const displayPrice = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;

  return (
    <div className="bg-white border border-green-200 rounded-lg shadow-sm p-4 relative w-full max-w-[230px]">
      {/* Image Container with fixed aspect ratio */}
      <div className="w-full aspect-square bg-gray-100 rounded-md mb-4 overflow-hidden flex items-center justify-center">
        <img
          src={imageUrl}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = placeholderImage;
            setImageLoaded(true);
          }}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!imageLoaded && (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
        )}
      </div>

      {/* Category */}
      {product.category && (
        <p className="text-xs text-gray-500 uppercase">{product.category}</p>
      )}

      {/* Name */}
      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mt-1">
        {product.name}
      </h3>

      {/* Description */}
      {product.description && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {product.description}
        </p>
      )}

      {/* Stock Status */}
      <div className="mt-2">
        {product.quantity > 0 ? (
          <span className="text-xs text-green-600">In Stock ({product.quantity} available)</span>
        ) : (
          <span className="text-xs text-red-600">Out of Stock</span>
        )}
      </div>

      {/* Price */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-lg font-semibold text-primaryDark">
          ₹{displayPrice}
        </span>
      </div>

      {/* Add Button */}
      <button 
        onClick={handleAddToCart}
        disabled={loading || product.quantity === 0}
        className="w-full mt-4 btn-primary-sm py-2 disabled:opacity-50"
      >
        {loading ? "Adding..." : product.quantity > 0 ? "Add to Cart" : "Out of Stock"}
      </button>

      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastMessage.includes("added") ? "success" : toastMessage.includes("Please login") ? "warning" : "error"}
          duration={3000}
        />
      )}
    </div>
  );
}

export default ProductCard;
