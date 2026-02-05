import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartAPI, ordersAPI } from '../services/api';
import CustomerNavbar from '../components/CustomerNavbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [formData, setFormData] = useState({
    delivery_type: 'schedule_delivery',
    address: '',
    state: '',
    district: '',
    pincode: '',
    preferred_date: '',
    preferred_time: '',
    payment_method: 'cash',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please login to proceed with checkout', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    loadCart();
  }, [isAuthenticated]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await cartAPI.get();
      if (!data?.items || data.items.length === 0) {
        navigate('/cart');
        return;
      }
      setCart(data);
    } catch (err) {
      console.error('Error loading cart:', err);
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const validateForm = () => {
    const newErrors = {};
    const needsAddress = formData.delivery_type === 'schedule_delivery' || formData.delivery_type === 'express_delivery';
    const isExpress = formData.delivery_type === 'express_delivery';
    const isPickup = formData.delivery_type === 'pickup';

    if (needsAddress) {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 5) {
        newErrors.address = 'Please enter a complete address';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!formData.district.trim()) {
        newErrors.district = 'District is required';
      }
      if (!formData.pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
        newErrors.pincode = 'Pincode must be 6 digits';
      }
    }

    if (!isExpress && !formData.preferred_date.trim()) {
      newErrors.preferred_date = formData.delivery_type === 'schedule_delivery'
        ? 'Please select a preferred delivery date'
        : 'Please select a preferred pickup date';
    } else if (!isExpress && formData.preferred_date.trim()) {
      const chosen = new Date(formData.preferred_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        newErrors.preferred_date = 'Date cannot be in the past';
      }
    }

    if (!isPickup && !formData.preferred_time.trim()) {
      newErrors.preferred_time = isExpress
        ? 'Please select preferred time for express delivery'
        : 'Please select preferred time for delivery';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    if (name === 'delivery_type' && value === 'express_delivery') {
      updates.preferred_date = new Date().toISOString().split('T')[0];
    }
    setFormData(prev => ({ ...prev, ...updates }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'delivery_type' && value === 'pickup') {
      setErrors(prev => ({
        ...prev,
        address: '', state: '', district: '', pincode: '', preferred_time: '',
      }));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setProcessing(true);
    try {
      const needsAddress = formData.delivery_type === 'schedule_delivery' || formData.delivery_type === 'express_delivery';
      const shippingAddress = needsAddress
        ? `${formData.address.trim()}, ${formData.district.trim()}, ${formData.state.trim()} - ${formData.pincode.trim()}`
        : null;

      const preferredDate = formData.delivery_type === 'express_delivery'
        ? new Date().toISOString().split('T')[0]
        : (formData.preferred_date || null);

      const orderData = {
        items: cart.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        shipping_address: shippingAddress,
        payment_method: formData.payment_method,
        delivery_type: formData.delivery_type,
        preferred_date: preferredDate,
        preferred_time: formData.preferred_time || null,
      };

      // Create order
      const result = await ordersAPI.create(orderData);
      
      // Clear cart after successful order
      showToast('Order placed successfully!', 'success');
      
      // Redirect to success page
      setTimeout(() => {
        navigate(`/success?orderId=${result.id}`);
      }, 1000);
    } catch (err) {
      console.error('Error placing order:', err);
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <CustomerNavbar title="Checkout" cartCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const itemPrice = (item) => item.product.effective_price != null ? item.product.effective_price : item.product.price;
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(itemPrice(item)) * item.quantity), 0);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CustomerNavbar title="Checkout" cartCount={cartItems.length} />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Cart
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h2>

              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* Schedule Delivery / Express Delivery / Pickup */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery option *</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className={`flex-1 flex flex-col gap-1 p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.delivery_type === 'schedule_delivery' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="delivery_type"
                        value="schedule_delivery"
                        checked={formData.delivery_type === 'schedule_delivery'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="font-medium text-gray-800">Schedule Delivery</span>
                      <span className="text-sm text-gray-500">Get it at your address on a date you choose</span>
                    </label>
                    <label className={`flex-1 flex flex-col gap-1 p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.delivery_type === 'express_delivery' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="delivery_type"
                        value="express_delivery"
                        checked={formData.delivery_type === 'express_delivery'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="font-medium text-gray-800">Express Delivery</span>
                      <span className="text-sm text-gray-500">Same-day delivery — farmer will be notified as urgent</span>
                    </label>
                    <label className={`flex-1 flex flex-col gap-1 p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.delivery_type === 'pickup' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="delivery_type"
                        value="pickup"
                        checked={formData.delivery_type === 'pickup'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="font-medium text-gray-800">Pickup</span>
                      <span className="text-sm text-gray-500">Collect from farmer/seller</span>
                    </label>
                  </div>
                </div>

                {/* Preferred date — hidden for express (auto today) */}
                {formData.delivery_type !== 'express_delivery' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {formData.delivery_type === 'schedule_delivery' ? 'Preferred delivery date *' : 'Preferred pickup date *'}
                  </label>
                  <input
                    type="date"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-500 ${
                      errors.preferred_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.preferred_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.preferred_date}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.delivery_type === 'schedule_delivery'
                      ? 'Select when you would like to receive your order.'
                      : 'Select when you would like to pick up your order.'}
                  </p>
                </div>
                )}

                {/* Express: show today's date as fixed */}
                {formData.delivery_type === 'express_delivery' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800">Same-day delivery</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Date is set to today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}). Choose your preferred time below.
                  </p>
                </div>
                )}

                {/* Preferred time for delivery / express */}
                {formData.delivery_type !== 'pickup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred time for delivery *
                  </label>
                  <select
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-500 ${
                      errors.preferred_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select preferred time slot</option>
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 5 PM)">Afternoon (12 PM - 5 PM)</option>
                    <option value="Evening (5 PM - 9 PM)">Evening (5 PM - 9 PM)</option>
                  </select>
                  {errors.preferred_time && (
                    <p className="text-red-600 text-sm mt-1">{errors.preferred_time}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    When would you like to receive your order?
                  </p>
                </div>
                )}

                {/* Shipping Address Form - for schedule delivery and express delivery */}
                {(formData.delivery_type === 'schedule_delivery' || formData.delivery_type === 'express_delivery') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Shipping Address *</h3>
                  
                  {/* Address */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address (Street, Building, Area) *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your street address, building name, area"
                      rows="3"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-500 resize-none ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  {/* State and District Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-500 ${
                          errors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.state && (
                        <p className="text-red-600 text-sm mt-1">{errors.state}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        District *
                      </label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        placeholder="Enter district"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-500 ${
                          errors.district ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.district && (
                        <p className="text-red-600 text-sm mt-1">{errors.district}</p>
                      )}
                    </div>
                  </div>

                  {/* Pincode */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit pincode"
                      maxLength="6"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-500 ${
                        errors.pincode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors.pincode && (
                      <p className="text-red-600 text-sm mt-1">{errors.pincode}</p>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Make sure your address is complete and accurate for delivery
                  </p>
                </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-500 ${
                      errors.payment_method ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="cash">Cash on Delivery</option>
                  </select>
                  {errors.payment_method && (
                    <p className="text-red-600 text-sm mt-1">{errors.payment_method}</p>
                  )}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                      Cash on Delivery is available. You can pay directly when you receive your order.
                    </p>
                  </div>
                </div>

                {/* User Info Display */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Order placed by:</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium">Name:</span> {user?.name}</p>
                    <p><span className="font-medium">Email:</span> {user?.email}</p>
                    {user?.phone && <p><span className="font-medium">Phone:</span> {user.phone}</p>}
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h3>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 border-b pb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{item.product.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      ₹{(parseFloat(itemPrice(item)) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Delivery option & date & time */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">
                    {formData.delivery_type === 'schedule_delivery' ? 'Schedule Delivery' : formData.delivery_type === 'express_delivery' ? 'Express Delivery' : 'Pickup'}
                  </span>
                  {formData.delivery_type === 'express_delivery' && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">Urgent</span>
                  )}
                  {(formData.preferred_date || formData.delivery_type === 'express_delivery') && (
                    <span className="block mt-1 text-gray-500">
                      {formData.delivery_type === 'express_delivery'
                        ? `Today (${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`
                        : `${formData.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'} date: ${new Date((formData.preferred_date || '') + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </span>
                  )}
                  {formData.preferred_time && formData.delivery_type !== 'pickup' && (
                    <span className="block mt-0.5 text-gray-500">Time: {formData.preferred_time}</span>
                  )}
                </p>
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{formData.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-green-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  ✓ Free delivery on all orders
                </p>
                <p className="text-sm text-green-700 mt-2">
                  ✓ Cash on Delivery available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          duration={3000}
          position="center"
          onClose={() => setToast({ show: false, message: "", type: "info" })}
        />
      )}

      <Footer />
    </div>
  );
}

export default Checkout;
