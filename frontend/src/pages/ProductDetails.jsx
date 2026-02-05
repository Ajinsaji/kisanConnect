import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CustomerNavbar from "../components/CustomerNavbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { productsAPI, cartAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    loadProduct();
    loadSuggestedProducts();
    if (isAuthenticated) {
      loadCartCount();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && product) {
      checkIfInCart();
    } else {
      setIsInCart(false);
    }
  }, [product, isAuthenticated]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.get(parseInt(id));
      setProduct(data);
      // Filter out blob URLs
      setSelectedImage(data.image_url && !data.image_url.startsWith('blob:') 
        ? data.image_url 
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E");
    } catch (err) {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestedProducts = async () => {
    try {
      const data = await productsAPI.list();
      setSuggestedProducts(data.filter(p => p.id !== parseInt(id)).slice(0, 6));
    } catch {}
  };

  const loadCartCount = async () => {
    try {
      const cart = await cartAPI.get();
      setCartCount(cart?.items?.length || 0);
    } catch {}
  };

  const checkIfInCart = async () => {
    if (!product) return;
    try {
      const cart = await cartAPI.get();
      const isProductInCart = cart?.items?.some(item => item.product_id === product.id) || false;
      setIsInCart(isProductInCart);
    } catch {
      setIsInCart(false);
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast("Please login to add items", "warning");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }
    try {
      await cartAPI.add(product.id, quantity);
      showToast("Added to cart", "success");
      setIsInCart(true);
      loadCartCount();
    } catch {
      showToast("Failed to add to cart", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7f6]">
        <CustomerNavbar title="Product" cartCount={cartCount} />
        <p className="text-center py-32 text-gray-600">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f5f7f6] flex items-center justify-center">
        <p className="text-red-600">{error || "Product not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      <CustomerNavbar title="Product Details" cartCount={cartCount} />

      {/* MAIN SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* IMAGE */}
        <div className="bg-white rounded-3xl px-3 pt-3 pb-2 shadow border max-w-sm mx-auto">
          <img
            src={selectedImage}
            alt={product.name}
            className="w-full max-w-xs mx-auto h-[180px] object-contain rounded-2xl"
          />
        </div>

        {/* INFO */}
        <div className="bg-white rounded-3xl p-8 shadow border">
          <p className="text-sm text-green-700 font-medium mb-2">
            🌾 Direct from farmer
          </p>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            {product.name}
          </h1>

          <p className="text-gray-600 mb-4">
            {product.description || "Fresh farm product"}
          </p>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold text-green-700">
              ₹{(product.effective_price ?? product.price).toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">per kg</span>
            {product.effective_price != null && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                Special offer for you
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Available:{" "}
            <span className="font-semibold text-green-700">
              {product.quantity} kg
            </span>
          </p>

          {/* QUANTITY */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 border rounded-xl"
            >
              −
            </button>
            <span className="text-lg font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2 border rounded-xl"
            >
              +
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={product.quantity === 0 || isInCart}
            className={`w-full py-4 rounded-2xl font-semibold transition disabled:opacity-50 ${
              isInCart
                ? "bg-gray-500 text-white cursor-not-allowed"
                : product.quantity === 0
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {product.quantity === 0
              ? "Out of Stock"
              : isInCart
              ? "Added to Cart"
              : "Add to Cart"}
          </button>
        </div>
        </div>

        {/* PRODUCT INFO */}
        <div className="mt-12">
          <div className="bg-white rounded-3xl shadow border p-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Product Information
            </h2>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <Info label="Product ID" value={`#${product.id}`} />
              <Info label="Category" value={product.category || "—"} />
              <Info
                label="Price"
                value={
                  product.effective_price != null
                    ? `₹${product.effective_price} (special offer) — listed ₹${product.price}`
                    : `₹${product.price}`
                }
              />
              <Info label="Stock" value={`${product.quantity} kg`} />
              <Info
                label="Listed On"
                value={new Date(product.created_at).toLocaleDateString()}
              />
            </div>
          </div>
        </div>

        {/* FARMER DETAILS */}
        {product.farmer && (
          <div className="mt-12">
            <div className="bg-white rounded-3xl shadow border p-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
                <span>🚜</span>
                Farmer Details
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-semibold text-gray-800 text-lg">{product.farmer.name}</p>
                  </div>
                  {product.farmer.email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-semibold text-gray-800">{product.farmer.email}</p>
                    </div>
                  )}
                  {product.farmer.phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="font-semibold text-gray-500 tracking-widest">xxxxxxxxxx</p>
                      <a
                        href={`tel:${product.farmer.phone}`}
                        className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        <span aria-hidden>📞</span>
                        Call
                      </a>
                    </div>
                  )}
                  {(product.farmer.address || product.farmer.city || product.farmer.state || product.farmer.postal_code) && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Address</p>
                      <p className="font-semibold text-gray-800">
                        {[
                          product.farmer.address,
                          product.farmer.city,
                          product.farmer.state,
                          product.farmer.postal_code
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUGGESTED */}
        {suggestedProducts.length > 0 && (
          <div className="mt-12 pb-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            You may also like
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="bg-white rounded-2xl shadow border p-4 cursor-pointer hover:shadow-lg transition"
              >
                <img
                  src={p.image_url && !p.image_url.startsWith('blob:')
                    ? p.image_url
                    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23e5e7eb' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"}
                  alt={p.name}
                  className="h-44 w-full object-cover rounded-xl mb-4"
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23e5e7eb' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
                <h3 className="font-semibold text-gray-800">{p.name}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {p.category}
                </p>
                <p className="mt-2 font-bold text-green-700">
                  ₹{p.price.toFixed(2)}
                </p>
              </div>
            ))}
           </div>
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

export default ProductDetails;

/* INFO ITEM */
function Info({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}
