import FarmerLayout from "../components/FarmerLayout";
import Toast from "../components/Toast";
import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { productsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function Inventory() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productName, setProductName] = useState("");
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState("");
  const [minNegotiablePrice, setMinNegotiablePrice] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadProducts();
    } else if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, user?.id]);

  const loadProducts = async () => {
    try {
      const data = await productsAPI.list();
      // Filter products to show only the current farmer's products
      const farmerProducts = data.filter(product => product.farmer_id === user?.id);
      setProducts(farmerProducts);
    } catch (err) {
      setError("Failed to load products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      const updateData = {
        name: productName,
        quantity: parseInt(stock) || 0,
      };
      if (price !== "") updateData.price = parseFloat(price);
      if (minNegotiablePrice !== "") updateData.min_negotiable_price = parseFloat(minNegotiablePrice);
      else updateData.min_negotiable_price = null;

      if (!isAvailable) updateData.quantity = 0;

      await productsAPI.update(selectedProduct.id, updateData);
      showToast("Product updated successfully!", "success");
      setIsEditOpen(false);
      loadProducts(); // Reload products to reflect changes
    } catch (err) {
      showToast(err.message || "Failed to update product", "error");
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await productsAPI.delete(selectedProduct.id);
      showToast(`Product "${selectedProduct.name}" deleted successfully!`, "success");
      setIsEditOpen(false);
      setShowDeleteConfirm(false);
      loadProducts(); // Reload products to reflect changes
    } catch (err) {
      showToast(err.message || "Failed to delete product", "error");
      setShowDeleteConfirm(false);
    }
  };

  return (
    <FarmerLayout activeTab="products">
      <div className="flex flex-col">
        {/* Main Content */}
        <div className="flex-1 mx-14 px-5 pb-12 mt-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/farmer-dashboard')}
            className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-4 font-medium transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>

          {/* Page Title */}
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Your Products
          </h2>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <p className="text-gray-600">Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-lg mb-4">No products added yet</p>
              <button
                onClick={() => navigate("/register-product")}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Add Your First Product
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-green-200 rounded-lg shadow-sm p-4 relative"
              >

                {/* Image */}
                <img
                  src={product.image_url && !product.image_url.startsWith('blob:')
                    ? product.image_url 
                    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23e5e7eb' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                  onError={(e) => {
                    // If image fails to load, use data URI placeholder
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23e5e7eb' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />

                {/* Name */}
                <h3 className="text-lg font-medium text-gray-800">
                  {product.name}
                </h3>

                {/* Category */}
                {product.category && (
                  <p className="text-sm text-gray-500 mt-1">
                    Category: <span className="font-medium">{product.category}</span>
                  </p>
                )}

                {/* Stock */}
                <p className="text-sm text-gray-500 mt-1">
                  Stock: <span className="font-medium">{product.quantity} kg</span>
                </p>

                {/* Price */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-lg font-semibold text-primaryDark">
                    ₹{product.price}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <button
                    className="flex-1 btn-secondary-sm py-2"
                    onClick={() => {
                        setSelectedProduct(product);
                        setProductName(product.name);
                        setStock(product.quantity);
                        setIsAvailable(product.quantity > 0);
                        setIsEditOpen(true);
                    }}
                    >
                    Edit Product
                    </button>
                    <Modal
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        title="Edit Product"
                        >
                        {selectedProduct && (
                            <div className="space-y-4">

                            {/* Product Name */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                Product Name
                                </label>
                                <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Enter product name"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Price (₹/kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            {/* Min negotiable price */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Min price I can offer (₹/kg) — optional</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={minNegotiablePrice}
                                    onChange={(e) => setMinNegotiablePrice(e.target.value)}
                                    placeholder="e.g. 15"
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            {/* Inventory */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                Current Inventory
                                </label>
                                <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>

                            {/* Availability Toggle */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Product Available</span>
                                <button
                                type="button"
                                onClick={() => setIsAvailable(!isAvailable)}
                                className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                                    isAvailable ? "bg-primaryDark" : "bg-gray-300"
                                }`}
                                >
                                <span
                                    className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                                    isAvailable ? "translate-x-6" : "translate-x-0"
                                    }`}
                                />
                                </button>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center pt-4">

                                {/* Delete */}
                                <button
                                type="button"
                                className="text-red-600 text-sm hover:underline"
                                onClick={handleDeleteProduct}
                                >
                                Delete Product
                                </button>

                                <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-4 py-2 border rounded-md text-sm"
                                >
                                    Cancel
                                </button>

                                <button 
                                    onClick={handleUpdateProduct}
                                    className="btn-primary-sm px-6 py-2"
                                >
                                    Save Changes
                                </button>
                                </div>
                            </div>

                            </div>
                        )}
                        </Modal>


                </div>

              </div>
            ))}
          </div>
          )}
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            position="center"
            onClose={() => setToast({ show: false, message: "", type: "info" })}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <Modal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            title="Confirm Delete"
          >
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </FarmerLayout>
  );
}

export default Inventory;
