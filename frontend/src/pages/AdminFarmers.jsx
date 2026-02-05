import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AdminNavbar from "../components/AdminNavbar";
import Toast from "../components/Toast";
import Modal from "../components/Modal";

function AdminFarmers() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [confirmAction, setConfirmAction] = useState({ show: false, message: "", onConfirm: null });

  useEffect(() => {
    fetchFarmers();
  }, []);

  useEffect(() => {
    filterFarmers();
  }, [searchTerm, farmers]);

  const fetchFarmers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await fetch("http://localhost:8000/admin/users/farmers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch farmers");
      }

      const data = await response.json();
      setFarmers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterFarmers = () => {
    let filtered = farmers;

    if (searchTerm) {
      filtered = filtered.filter(
        (farmer) =>
          farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          farmer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFarmers(filtered);
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmAction({ show: true, message, onConfirm });
  };

  const handleBanFarmer = async (farmerId) => {
    showConfirm("Are you sure you want to ban this farmer?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${farmerId}/ban`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to ban farmer");
        }

        setFarmers(farmers.map(f => f.id === farmerId ? { ...f, is_banned: true } : f));
        if (selectedFarmer?.id === farmerId) {
          setSelectedFarmer({ ...selectedFarmer, is_banned: true });
        }
        showToast("Farmer banned successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const handleUnbanFarmer = async (farmerId) => {
    showConfirm("Are you sure you want to unban this farmer?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${farmerId}/unban`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to unban farmer");
        }

        setFarmers(farmers.map(f => f.id === farmerId ? { ...f, is_banned: false } : f));
        if (selectedFarmer?.id === farmerId) {
          setSelectedFarmer({ ...selectedFarmer, is_banned: false });
        }
        showToast("Farmer unbanned successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const handleDeactivateFarmer = async (farmerId) => {
    showConfirm("Are you sure you want to deactivate this farmer?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${farmerId}/deactivate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to deactivate farmer");
        }

        setFarmers(farmers.map(f => f.id === farmerId ? { ...f, is_active: false } : f));
        if (selectedFarmer?.id === farmerId) {
          setSelectedFarmer({ ...selectedFarmer, is_active: false });
        }
        showToast("Farmer deactivated successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const handleActivateFarmer = async (farmerId) => {
    showConfirm("Are you sure you want to activate this farmer?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${farmerId}/activate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to activate farmer");
        }

        setFarmers(farmers.map(f => f.id === farmerId ? { ...f, is_active: true } : f));
        if (selectedFarmer?.id === farmerId) {
          setSelectedFarmer({ ...selectedFarmer, is_active: true });
        }
        showToast("Farmer activated successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const viewFarmerDetails = async (farmerId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/users/${farmerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch farmer details");
      }

      const data = await response.json();
      setSelectedFarmer(data);
      
      // Fetch farmer's products
      const productsResponse = await fetch(`http://localhost:8000/admin/users/${farmerId}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (productsResponse.ok) {
        const products = await productsResponse.json();
        setFarmerDetails({ ...data, products });
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading farmers...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNavbar />
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 font-medium transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Farmer Management</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search farmers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Farmers Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">Farmer ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">City</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-700">#{farmer.id}</td>
                      <td className="px-4 py-3">{farmer.name}</td>
                      <td className="px-4 py-3">{farmer.email}</td>
                      <td className="px-4 py-3">{farmer.city || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            farmer.is_banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {farmer.is_banned ? 'Banned' : 'Active'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            farmer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {farmer.is_active ? 'Online' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewFarmerDetails(farmer.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2"
                        >
                          View
                        </button>
                        {farmer.is_banned ? (
                          <button
                            onClick={() => handleUnbanFarmer(farmer.id)}
                            disabled={actionInProgress}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm mr-2 disabled:opacity-50"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanFarmer(farmer.id)}
                            disabled={actionInProgress}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredFarmers.length === 0 && (
              <p className="text-center py-8 text-gray-500">No farmers found</p>
            )}
          </div>

          {/* Farmer Details Modal */}
          {selectedFarmer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-96 overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Farmer Details</h2>
                    <button
                      onClick={() => setSelectedFarmer(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Farmer ID</p>
                      <p className="font-semibold text-lg text-blue-600">#{selectedFarmer.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{selectedFarmer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{selectedFarmer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{selectedFarmer.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold">{selectedFarmer.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-semibold">{selectedFarmer.city || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-semibold">{selectedFarmer.state || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ban Status</p>
                      <p className={`font-semibold ${selectedFarmer.is_banned ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedFarmer.is_banned ? 'Banned' : 'Active'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Status</p>
                      <p className={`font-semibold ${selectedFarmer.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                        {selectedFarmer.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  {/* Products List */}
                  {farmerDetails?.products && (
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-3">Products ({farmerDetails.products.length})</h3>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {farmerDetails.products.map(product => (
                          <div key={product.id} className="border rounded p-2 bg-gray-50">
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-xs text-gray-600">₹{product.price} (Qty: {product.quantity})</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {selectedFarmer.is_banned ? (
                      <button
                        onClick={() => {
                          handleUnbanFarmer(selectedFarmer.id);
                          setSelectedFarmer(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Unban Farmer
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleBanFarmer(selectedFarmer.id);
                          setSelectedFarmer(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Ban Farmer
                      </button>
                    )}
                    
                    {selectedFarmer.is_active ? (
                      <button
                        onClick={() => {
                          handleDeactivateFarmer(selectedFarmer.id);
                          setSelectedFarmer(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleActivateFarmer(selectedFarmer.id);
                          setSelectedFarmer(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* Confirmation Modal */}
      {confirmAction.show && (
        <Modal
          isOpen={confirmAction.show}
          onClose={() => setConfirmAction({ show: false, message: "", onConfirm: null })}
          title="Confirm Action"
        >
          <div className="space-y-4">
            <p className="text-gray-700">{confirmAction.message}</p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setConfirmAction({ show: false, message: "", onConfirm: null })}
                className="px-4 py-2 border rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.onConfirm) {
                    confirmAction.onConfirm();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
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

export default AdminFarmers;
