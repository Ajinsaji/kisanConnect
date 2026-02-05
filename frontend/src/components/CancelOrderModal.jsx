import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CANCEL_REASONS = [
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'found_better_price', label: 'Found a better price elsewhere' },
  { value: 'wrong_item', label: 'Ordered wrong item' },
  { value: 'delivery_too_slow', label: 'Delivery will be too slow' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'other', label: 'Other reason' },
];

function CancelOrderModal({ isOpen, onClose, onConfirm, orderId, productNames }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      return;
    }

    const reason = selectedReason === 'other' 
      ? customReason.trim() 
      : CANCEL_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

    if (!reason) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(orderId, reason);
      // Reset form
      setSelectedReason('');
      setCustomReason('');
      onClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setCustomReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Cancel Order</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-4">
            Please tell us why you're cancelling this order:
          </p>

          {/* Reason Options */}
          <div className="space-y-3 mb-4">
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mr-3 text-green-600 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                <span className="text-gray-700">{reason.label}</span>
              </label>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason for cancellation..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                disabled={isSubmitting}
                required={selectedReason === 'other'}
              />
            </div>
          )}

          {/* Error Message */}
          {!selectedReason && (
            <p className="text-red-600 text-sm mb-4">Please select a reason for cancellation</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelOrderModal;
