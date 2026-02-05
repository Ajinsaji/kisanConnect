import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AdminNavbar from "../components/AdminNavbar";
import Toast from "../components/Toast";
import Modal from "../components/Modal";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [confirmAction, setConfirmAction] = useState({ show: false, message: "", onConfirm: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await fetch("http://localhost:8000/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmAction({ show: true, message, onConfirm });
  };

  const handleBanUser = async (userId) => {
    showConfirm("Are you sure you want to ban this user?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${userId}/ban`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to ban user");
        }

        // Update the user in the list
        setUsers(users.map(u => u.id === userId ? { ...u, is_banned: true } : u));
        setSelectedUser(selectedUser && selectedUser.id === userId ? { ...selectedUser, is_banned: true } : selectedUser);
        showToast("User banned successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const handleUnbanUser = async (userId) => {
    showConfirm("Are you sure you want to unban this user?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${userId}/unban`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to unban user");
        }

        setUsers(users.map(u => u.id === userId ? { ...u, is_banned: false } : u));
        setSelectedUser(selectedUser && selectedUser.id === userId ? { ...selectedUser, is_banned: false } : selectedUser);
        showToast("User unbanned successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const handleDeactivateUser = async (userId) => {
    showConfirm("Are you sure you want to deactivate this user?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${userId}/deactivate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to deactivate user");
        }

        setUsers(users.map(u => u.id === userId ? { ...u, is_active: false } : u));
        setSelectedUser(selectedUser && selectedUser.id === userId ? { ...selectedUser, is_active: false } : selectedUser);
        showToast("User deactivated successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const handleActivateUser = async (userId) => {
    showConfirm("Are you sure you want to activate this user?", async () => {
      setActionInProgress(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/admin/users/${userId}/activate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to activate user");
        }

        setUsers(users.map(u => u.id === userId ? { ...u, is_active: true } : u));
        setSelectedUser(selectedUser && selectedUser.id === userId ? { ...selectedUser, is_active: true } : selectedUser);
        showToast("User activated successfully", "success");
      } catch (err) {
        showToast("Error: " + err.message, "error");
      } finally {
        setActionInProgress(false);
        setConfirmAction({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const viewUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      setSelectedUser(data);
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading users...</div>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Roles</option>
                <option value="farmer">Farmers</option>
                <option value="buyer">Buyers</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.role === 'farmer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.is_banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.is_banned ? 'Banned' : 'Active'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_active ? 'Online' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewUserDetails(user.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2"
                        >
                          View
                        </button>
                        {user.is_banned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            disabled={actionInProgress}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm mr-2 disabled:opacity-50"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.id)}
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

            {filteredUsers.length === 0 && (
              <p className="text-center py-8 text-gray-500">No users found</p>
            )}
          </div>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-semibold">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold">{selectedUser.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-semibold">{selectedUser.city || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`font-semibold ${selectedUser.is_banned ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedUser.is_banned ? 'Banned' : 'Active'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Status</p>
                      <p className={`font-semibold ${selectedUser.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {selectedUser.is_banned ? (
                      <button
                        onClick={() => {
                          handleUnbanUser(selectedUser.id);
                          setSelectedUser(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Unban User
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleBanUser(selectedUser.id);
                          setSelectedUser(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Ban User
                      </button>
                    )}
                    
                    {selectedUser.is_active ? (
                      <button
                        onClick={() => {
                          handleDeactivateUser(selectedUser.id);
                          setSelectedUser(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Deactivate User
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleActivateUser(selectedUser.id);
                          setSelectedUser(null);
                        }}
                        disabled={actionInProgress}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        Activate User
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
    </div>
  );
}

export default AdminUsers;
