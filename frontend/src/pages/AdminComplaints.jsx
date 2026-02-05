import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import Toast from "../components/Toast";
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [loadingFarmerDetails, setLoadingFarmerDetails] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMessageSection, setShowMessageSection] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [confirmDismiss, setConfirmDismiss] = useState({ show: false, complaintId: null });
  const [resolveModal, setResolveModal] = useState({ show: false, complaintId: null });
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (!token) {
        navigate("/admin-login");
        return;
      }

      const url = statusFilter === "all" 
        ? "http://localhost:8000/admin/complaints"
        : `http://localhost:8000/admin/complaints?status_filter=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('admin_token');
          navigate("/admin-login");
          return;
        }
        throw new Error("Failed to fetch complaints");
      }

      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError(err.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClick = (complaintId) => {
    setResolveModal({ show: true, complaintId });
    setResolutionComment("");
  };

  const handleResolve = async () => {
    if (!resolutionComment.trim()) {
      showToast("Please enter a resolution comment explaining how the issue was resolved", "warning");
      return;
    }

    setResolving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/complaints/${resolveModal.complaintId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resolution_comment: resolutionComment.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to resolve complaint");
      }

      showToast("Complaint resolved successfully", "success");
      await fetchComplaints();
      setSelectedComplaint(null);
      setResolveModal({ show: false, complaintId: null });
      setResolutionComment("");
      window.dispatchEvent(new Event("complaintsUpdated"));
    } catch (err) {
      showToast(err.message || "Failed to resolve complaint", "error");
    } finally {
      setResolving(false);
    }
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const handleDismissClick = (complaintId) => {
    setConfirmDismiss({ show: true, complaintId });
  };

  const handleDismiss = async (complaintId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/complaints/${complaintId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss complaint");
      }

      showToast("Complaint dismissed successfully", "success");
      await fetchComplaints();
      setSelectedComplaint(null);
      setConfirmDismiss({ show: false, complaintId: null });
      window.dispatchEvent(new Event("complaintsUpdated"));
    } catch (err) {
      showToast(err.message || "Failed to dismiss complaint", "error");
    }
  };

  const fetchFarmerDetails = async (complaintId) => {
    try {
      setLoadingFarmerDetails(true);
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/complaints/${complaintId}/farmer-details`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch farmer details");
      }

      const data = await response.json();
      setFarmerDetails(data);
    } catch (err) {
      console.error("Error fetching farmer details:", err);
      showToast(err.message || "Failed to load farmer details", "error");
    } finally {
      setLoadingFarmerDetails(false);
    }
  };

  const handleSendQuickMessage = () => {
    const quickMessage = "This is an official message from Kisan Connect team. We are sorry for this inconvenience. We will take immediate action for your complaint. Thank you for bringing this to our attention.";
    setMessageText(quickMessage);
    setShowMessageSection(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      showToast("Please enter a message", "warning");
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/complaints/${selectedComplaint.id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      showToast("Message sent successfully! Customer will be notified.", "success");
      setMessageText("");
      setShowMessageSection(false);
    } catch (err) {
      showToast(err.message || "Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setFarmerDetails(null);
    setShowMessageSection(false);
    setMessageText("");
    fetchFarmerDetails(complaint.id);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplaintTypeLabel = (type) => {
    switch (type) {
      case 'product_damage':
        return 'Product Damage';
      case 'farmer_issue':
        return 'Issue with Farmer';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading complaints...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNavbar />
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="text-green-600 hover:text-green-700 mb-4 font-medium"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Complaints Management</h1>
            <p className="text-gray-600">View and manage customer complaints</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
          )}

          {/* Filter */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Complaints</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {/* Complaints Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {complaints.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No complaints found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{complaint.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{complaint.order_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {complaint.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {complaint.farmer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getComplaintTypeLabel(complaint.complaint_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewComplaint(complaint)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            View
                          </button>
                          {complaint.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleResolveClick(complaint.id)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleDismissClick(complaint.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Complaint Details</h2>
                <button
                  onClick={() => {
                    setSelectedComplaint(null);
                    setFarmerDetails(null);
                    setShowMessageSection(false);
                    setMessageText("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Complaint Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Complaint Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Complaint ID</p>
                      <p className="font-semibold">#{selectedComplaint.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-semibold">#{selectedComplaint.order_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-semibold">{selectedComplaint.user_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Farmer</p>
                      <p className="font-semibold">{selectedComplaint.farmer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Complaint Type</p>
                      <p className="font-semibold">{getComplaintTypeLabel(selectedComplaint.complaint_type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                        {selectedComplaint.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted</p>
                      <p className="font-semibold">{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                    </div>
                    {selectedComplaint.resolved_at && (
                      <div>
                        <p className="text-sm text-gray-500">Resolved</p>
                        <p className="font-semibold">{new Date(selectedComplaint.resolved_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>
                </div>

                {/* Resolution Comment - Show if resolved */}
                {selectedComplaint.status === 'resolved' && selectedComplaint.resolution_comment && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 mb-2">Resolution Comment</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedComplaint.resolution_comment}</p>
                    {selectedComplaint.resolved_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Resolved on: {new Date(selectedComplaint.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Farmer Details & Selling History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Farmer Details & Selling History</h3>
                  {loadingFarmerDetails ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                      <p className="text-gray-600">Loading farmer details...</p>
                    </div>
                  ) : farmerDetails ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                      {/* Farmer Information */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Farmer Information</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Name</p>
                            <p className="font-semibold">{farmerDetails.farmer.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-semibold">{farmerDetails.farmer.email}</p>
                          </div>
                          {farmerDetails.farmer.phone && (
                            <div>
                              <p className="text-gray-600">Phone</p>
                              <p className="font-semibold">{farmerDetails.farmer.phone}</p>
                            </div>
                          )}
                          {(farmerDetails.farmer.address || farmerDetails.farmer.city || farmerDetails.farmer.state) && (
                            <div>
                              <p className="text-gray-600">Address</p>
                              <p className="font-semibold">
                                {[farmerDetails.farmer.address, farmerDetails.farmer.city, farmerDetails.farmer.state, farmerDetails.farmer.postal_code].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="border-t pt-3">
                        <h4 className="font-semibold text-gray-800 mb-2">Selling Statistics</h4>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Total Products</p>
                            <p className="font-semibold text-lg">{farmerDetails.statistics.total_products}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Orders</p>
                            <p className="font-semibold text-lg">{farmerDetails.statistics.total_orders}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Revenue</p>
                            <p className="font-semibold text-lg">₹{farmerDetails.statistics.total_revenue.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Recent Products */}
                      {farmerDetails.products && farmerDetails.products.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="font-semibold text-gray-800 mb-2">Products ({farmerDetails.products.length})</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {farmerDetails.products.slice(0, 5).map((product) => (
                              <div key={product.id} className="text-sm bg-white p-2 rounded border border-gray-200">
                                <span className="font-medium">{product.name}</span>
                                <span className="text-gray-500 ml-2">- ₹{product.price.toFixed(2)}</span>
                                <span className="text-gray-500 ml-2">({product.quantity} kg)</span>
                              </div>
                            ))}
                            {farmerDetails.products.length > 5 && (
                              <p className="text-xs text-gray-500">+ {farmerDetails.products.length - 5} more products</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recent Orders */}
                      {farmerDetails.recent_orders && farmerDetails.recent_orders.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="font-semibold text-gray-800 mb-2">Recent Orders</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {farmerDetails.recent_orders.map((order) => (
                              <div key={order.id} className="text-sm bg-white p-2 rounded border border-gray-200">
                                <span className="font-medium">Order #{order.id}</span>
                                <span className="text-gray-500 ml-2">- ₹{order.total_amount.toFixed(2)}</span>
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                      <p className="text-gray-600">Failed to load farmer details</p>
                    </div>
                  )}
                </div>

                {/* Send Message to Customer */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Send Message to Customer</h3>
                    {!showMessageSection && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendQuickMessage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Quick Message
                        </button>
                        <button
                          onClick={() => setShowMessageSection(true)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                          Manual Message
                        </button>
                      </div>
                    )}
                  </div>

                  {showMessageSection && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={4}
                        placeholder="Enter your message to the customer..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !messageText.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingMessage ? 'Sending...' : 'Send Message'}
                        </button>
                        <button
                          onClick={() => {
                            setShowMessageSection(false);
                            setMessageText("");
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        The customer will receive a notification about this message.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedComplaint.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleResolveClick(selectedComplaint.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Resolve Complaint
                    </button>
                    <button
                      onClick={() => handleDismissClick(selectedComplaint.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolveModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Resolve Complaint</h3>
            <p className="text-gray-600 mb-4">
              Please provide a comment explaining how the issue was resolved. This comment is required.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                placeholder="Explain how the issue was resolved..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                disabled={resolving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 10 characters required
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResolveModal({ show: false, complaintId: null });
                  setResolutionComment("");
                }}
                disabled={resolving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving || !resolutionComment.trim() || resolutionComment.trim().length < 10}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resolving ? 'Resolving...' : 'Confirm Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Dismiss */}
      {confirmDismiss.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Dismiss</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to dismiss this complaint? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDismiss({ show: false, complaintId: null })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDismiss(confirmDismiss.complaintId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Confirm Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-center"
          onClose={() => setToast({ show: false, message: "", type: "info" })}
        />
      )}
    </div>
  );
}

export default AdminComplaints;
