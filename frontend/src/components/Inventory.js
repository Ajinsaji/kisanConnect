import React from 'react';
import { useNavigate } from 'react-router-dom';

function InventoryCard({ products = [] }) {
  const navigate = useNavigate();
  
  // Get top 3 products (or all if less than 3)
  const displayProducts = products.slice(0, 3);
  
  // Helper function to format quantity with unit
  const formatQuantity = (product) => {
    if (!product.quantity) return '0 kg';
    const category = product.category?.toLowerCase() || '';
    // Fruits/vegetables and farm produce: show in kg
    if (category.includes('fruit') || category.includes('vegetable') || category) {
      return `${product.quantity} kg`;
    }
    return `${product.quantity} kg`;
  };

  return (
    <div className="border border-primaryDark rounded-lg bg-white shadow-sm">

      {/* Header */}
      <div className="px-4 py-3 bg-primaryDark flex items-center justify-between text-white rounded-t-lg">
        <h2 className="text-lg font-semibold">Inventory</h2>

        <button className="ml-auto btn-primary-sm text-sm"
            onClick={() => navigate("/register-product")}>
          Add new product
        </button>
        <button className="ml-1 btn-secondary-sm text-sm"
            onClick={() => navigate("/inventory")}>
          View more
        </button>
      </div>

      {/* Content */}
      <div className="p-4 text-sm space-y-2">
        {displayProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No products yet</p>
        ) : (
          displayProducts.map((product) => (
            <div key={product.id} className="flex justify-between">
              <span className="font-medium">{product.name}</span>
              <span>{formatQuantity(product)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InventoryCard;
