import FarmerLayout from "../components/FarmerLayout";
import Toast from "../components/Toast";
import { useState, useEffect, useRef } from "react";
import { productsAPI, messagingAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function RegisterProduct() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const imagesRef = useRef(images);
  const [productName, setProductName] = useState("");
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    price: "",
    quantity: "",
    min_negotiable_price: "",  // Optional: minimum price farmer can offer (e.g. 15 when listed 20)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // Keep ref in sync with state
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Product categories
  const categories = ["Fruits", "Vegetables", "Grains", "Dairy", "Other"];

  // ---- Handle product name input ----
  const handleProductChange = (e) => {
    setProductName(e.target.value);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  // ---- Image handling ----
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (images.length + selectedFiles.length > 3) {
      showToast("You can upload a maximum of 3 images", "warning");
      return;
    }

    const newImages = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    // Revoke blob URL to prevent memory leaks
    const imageToRemove = images[index];
    if (imageToRemove?.preview && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Cleanup blob URLs on unmount (safety net)
  useEffect(() => {
    return () => {
      // Cleanup any remaining blob URLs when component unmounts
      imagesRef.current.forEach((img) => {
        if (img?.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Use description as provided
    const description = formData.description || "";

    let imageUrl = null;

    // Upload image to server if one is selected
    if (images.length > 0) {
      try {
        const uploadResponse = await messagingAPI.uploadFile(images[0].file);
        // The backend returns file_url in the format "/api/uploads/images/{filename}"
        // We need to prepend the base URL to make it a full URL
        imageUrl = `http://localhost:8000${uploadResponse.file_url}`;
      } catch (uploadErr) {
        setError(uploadErr.message || "Failed to upload image");
        setLoading(false);
        return;
      }
    }

    try {
      await productsAPI.create({
        name: productName,
        category: formData.category || null,
        description: description || null,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        image_url: imageUrl,
        min_negotiable_price: formData.min_negotiable_price ? parseFloat(formData.min_negotiable_price) : null,
      });
      
      // Cleanup blob URLs after successful submission
      images.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
      
      showToast("Product registered successfully!", "success");
      setTimeout(() => {
        navigate("/farmer-dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to register product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FarmerLayout activeTab="products">
      <div className="px-5 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/farmer-dashboard')}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-4 font-medium transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="max-w-2xl mx-auto bg-white border border-green-200 rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 bg-primaryDark text-white rounded-t-lg">
            <h1 className="text-2xl font-semibold">Product Registration</h1>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={productName}
                onChange={handleProductChange}
                placeholder="Eg: Tomato, Wheat, Milk"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Price (₹/kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="₹"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Min negotiable price (optional) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Minimum price I can offer (₹/kg) — optional
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.min_negotiable_price}
                onChange={(e) => handleInputChange("min_negotiable_price", e.target.value)}
                placeholder="e.g. 15 (leave blank if no discount)"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                If set, customers can negotiate down to this price. Example: listed ₹20, min ₹15.
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Available Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="Quantity"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                required
                min="0"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Product description..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                rows="3"
              />
            </div>

            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Photos (optional, max 3 images)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={img.preview}
                      className="h-24 w-full object-cover rounded"
                      alt="preview"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black text-white rounded-full px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register Product"}
            </button>
          </form>
        </div>
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
    </FarmerLayout>
  );
}

export default RegisterProduct;
