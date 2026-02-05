import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function ReportIssueModal({ isOpen, onClose, onSubmit, orderId }) {
  const [complaintType, setComplaintType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!complaintType) {
      setError('Please select a complaint type');
      return;
    }
    
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit(orderId, complaintType, description.trim());
      // Reset form
      setComplaintType('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setComplaintType('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-800">Report an Issue</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Complaint Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue Type <span className="text-red-500">*</span>
            </label>
            <select
              value={complaintType}
              onChange={(e) => setComplaintType(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
              required
            >
              <option value="">Select issue type</option>
              <option value="product_damage">Product Damage</option>
              <option value="farmer_issue">Issue with Farmer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={5}
              placeholder="Please provide detailed information about the issue..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters ({description.length} characters)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Your complaint will be reviewed by our support team. 
              We take all reports seriously and will investigate the matter.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !complaintType || !description.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportIssueModal;
