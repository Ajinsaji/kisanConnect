import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, LinkIcon, PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AdminNavbar from "../components/AdminNavbar";
import Toast from "../components/Toast";
import { messagingAPI, API_BASE_URL } from "../services/api";

function AdminChat() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [sendMode, setSendMode] = useState("individual"); // "individual" or "group"
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [groupChatData, setGroupChatData] = useState({ group: null, messages: [], members: [] });
  const [groupChatLoading, setGroupChatLoading] = useState(false);

  useEffect(() => {
    fetchFarmers();
  }, []);

  useEffect(() => {
    filterFarmers();
  }, [searchTerm, farmers]);

  useEffect(() => {
    if (selectedFarmer) {
      fetchMessages(selectedFarmer.id);
    }
  }, [selectedFarmer]);

  useEffect(() => {
    if (sendMode === "group") {
      fetchGroupChat();
    }
  }, [sendMode]);

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

  const fetchMessages = async (farmerId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/admin/messages/farmer/${farmerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse()); // Show newest first
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchGroupChat = async () => {
    setGroupChatLoading(true);
    try {
      const data = await messagingAPI.getDefaultFarmerGroup();
      setGroupChatData({
        group: data.group || null,
        messages: data.messages || [],
        members: data.members || [],
      });
    } catch (err) {
      console.error("Failed to fetch group chat:", err);
      setGroupChatData({ group: null, messages: [], members: [] });
    } finally {
      setGroupChatLoading(false);
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

  const showToast = (msg, type = "info") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) {
      showToast("Please enter a message or select a file", "error");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Upload file if selected
      let fileUrl = null;
      let fileType = null;
      let fileName = null;
      
      if (selectedFile) {
        setUploadingFile(true);
        try {
          const uploadResult = await messagingAPI.uploadFile(selectedFile);
          fileUrl = uploadResult.file_url;
          fileType = uploadResult.file_type;
          fileName = uploadResult.file_name;
        } catch (uploadErr) {
          showToast(uploadErr.message || "Failed to upload file", "error");
          setSending(false);
          setUploadingFile(false);
          return;
        }
        setUploadingFile(false);
      }

      const payload = {
        farmer_id: sendMode === "individual" && selectedFarmer ? selectedFarmer.id : null,
        message_text: messageText || (selectedFile ? `Sent ${fileName}` : ""),
        message_type: messageType,
        link_url: linkUrl.trim() || null,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
      };

      const response = await fetch("http://localhost:8000/admin/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to send message");
      }

      const result = await response.json();
      
      // Clear form
      setMessageText("");
      setLinkUrl("");
      setMessageType("info");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (sendMode === "group") {
        showToast(`Message sent to ${result.recipients_count} farmers`, "success");
      } else {
        showToast("Message sent successfully", "success");
        // Refresh messages if individual
        if (selectedFarmer) {
          fetchMessages(selectedFarmer.id);
        }
      }
    } catch (err) {
      showToast(err.message || "Failed to send message", "error");
    } finally {
      setSending(false);
      setUploadingFile(false);
    }
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case "policy":
        return "bg-blue-500";
      case "news":
        return "bg-purple-500";
      case "announcement":
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  };

  const getMessageTypeLabel = (type) => {
    switch (type) {
      case "policy":
        return "📋 Government Policy";
      case "news":
        return "📰 Agriculture News";
      case "announcement":
        return "📢 Announcement";
      default:
        return "ℹ️ Information";
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Send Messages to Farmers
            </h1>
            <button
              onClick={() => navigate('/chat?group=free-to-ask')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition"
            >
              💬 Open "Free to Ask" Group Chat (two-way chat with farmers)
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Send Mode Toggle: Individual farmer vs Group message to all farmers */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <p className="text-sm text-gray-600 mb-3">Farmers can only view these messages; they cannot reply.</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-gray-700">Send to:</span>
              <button
                onClick={() => setSendMode("individual")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  sendMode === "individual"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                One farmer (individual)
              </button>
              <button
                onClick={() => setSendMode("group")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  sendMode === "group"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All farmers (group message)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Farmers List - Only show in individual mode */}
            {sendMode === "individual" && (
              <div className="lg:col-span-1 bg-white rounded-lg shadow h-fit">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Farmers</h2>
                  <input
                    type="text"
                    placeholder="Search farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="overflow-y-auto max-h-96">
                  {filteredFarmers.length > 0 ? (
                    filteredFarmers.map((farmer) => (
                      <div
                        key={farmer.id}
                        onClick={() => setSelectedFarmer(farmer)}
                        className={`p-3 border-b cursor-pointer transition ${
                          selectedFarmer?.id === farmer.id
                            ? 'bg-green-100 border-l-4 border-green-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-semibold text-sm">#{farmer.id} {farmer.name}</p>
                        <p className="text-xs text-gray-600">{farmer.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {farmer.city || 'Location not set'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No farmers found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message Composition Area */}
            <div className={`bg-white rounded-lg shadow flex flex-col ${sendMode === "individual" ? "lg:col-span-3" : "lg:col-span-4"} min-h-[500px]`}>
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {sendMode === "group" ? "Send Group Message to All Farmers" : selectedFarmer ? `Message to ${selectedFarmer.name}` : "Select a farmer to send message"}
                </h2>
                
                {/* Message Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message Type
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="info">ℹ️ General Information</option>
                    <option value="policy">📋 Government Policy</option>
                    <option value="news">📰 Agriculture News</option>
                    <option value="announcement">📢 Announcement</option>
                  </select>
                </div>

                {/* Message Text */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here... You can include government policies, agriculture news, or any information for farmers."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Link URL (Optional) */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/policy-page"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add a link to government policies, news articles, or relevant resources
                  </p>
                </div>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <PaperClipIcon className="w-4 h-4 inline mr-1" />
                    Attach File (Image or Document)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    Choose File
                  </label>
                  {selectedFile && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 flex-1">
                        📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: Images (JPG, PNG, GIF) and Documents (PDF, DOC, DOCX, XLS, XLSX, TXT). No file size limit.
                  </p>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={sending || uploadingFile || (!messageText.trim() && !selectedFile) || (sendMode === "individual" && !selectedFarmer)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {uploadingFile ? "Uploading..." : sending ? "Sending..." : sendMode === "group" ? "Send to All Farmers" : "Send Message"}
                </button>
              </div>

              {/* Recent Free to Ask group chats - Only show in group mode */}
              {sendMode === "group" && (
                <>
                  <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Recent chats in Free to Ask</h3>
                    <button
                      type="button"
                      onClick={fetchGroupChat}
                      disabled={groupChatLoading}
                      className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                    >
                      {groupChatLoading ? "Loading..." : "Refresh"}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-[280px] max-h-[400px]">
                    {groupChatLoading ? (
                      <p className="text-center text-gray-500 py-6">Loading recent chats...</p>
                    ) : groupChatData.messages.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">No messages yet in Free to Ask. Open the group chat to start the conversation.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {groupChatData.messages.map((msg) => {
                          const sender = groupChatData.members.find((m) => m.user_id === msg.sender_id);
                          const senderName = sender?.user?.name || (msg.sender_id ? `User #${msg.sender_id}` : "Unknown");
                          return (
                            <div key={msg.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                              <p className="text-xs font-semibold text-green-700 mb-1">{senderName}</p>
                              {msg.message_text && <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.message_text}</p>}
                              {msg.file_url && (
                                <div className="mt-2">
                                  {msg.file_type === "image" ? (
                                    <img
                                      src={`${API_BASE_URL}${msg.file_url}`}
                                      alt={msg.file_name || "Image"}
                                      className="max-w-full rounded max-h-40 object-contain"
                                    />
                                  ) : (
                                    <a
                                      href={`${API_BASE_URL}${msg.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 underline"
                                    >
                                      📄 {msg.file_name || "Download"}
                                    </a>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Message History - Only show in individual mode */}
              {sendMode === "individual" && selectedFarmer && (
                <>
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Message History</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {messages.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {messages.map((msg) => (
                          <div key={msg.id} className="flex justify-end">
                            <div className={`${getMessageTypeColor(msg.message_type)} text-white rounded-lg p-4 max-w-md`}>
                              <div className="text-xs font-semibold mb-1 opacity-90">
                                {getMessageTypeLabel(msg.message_type)}
                              </div>
                              {msg.message_text && <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>}
                              {msg.file_url && (
                                <div className="mt-2">
                                  {msg.file_type === "image" ? (
                                    <img
                                      src={`http://localhost:8000${msg.file_url}`}
                                      alt={msg.file_name || "Image"}
                                      className="max-w-full rounded-lg mt-2"
                                    />
                                  ) : (
                                    <a
                                      href={`http://localhost:8000${msg.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs underline mt-2 inline-block opacity-90 hover:opacity-100 bg-white/20 px-2 py-1 rounded"
                                    >
                                      📄 {msg.file_name || "Download Document"}
                                    </a>
                                  )}
                                </div>
                              )}
                              {msg.link_url && (
                                <a
                                  href={msg.link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline mt-2 inline-block opacity-90 hover:opacity-100"
                                >
                                  🔗 Open Link
                                </a>
                              )}
                              <p className="text-xs opacity-75 mt-2">
                                {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>No messages sent yet</p>
                        <p className="text-sm mt-2">Start a conversation by sending a message</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">💬 Messaging Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Individual & Group Messaging</h3>
                <p className="text-sm text-gray-600">
                  Send messages to individual farmers or broadcast to all farmers at once.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Policies & News</h3>
                <p className="text-sm text-gray-600">
                  Share government policies, agriculture news, and announcements with farmers. Include links to official resources.
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Notifications</h3>
                <p className="text-sm text-gray-600">
                  Farmers receive notifications when you send messages. They can view but cannot reply to admin messages.
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
          position="top-right"
          onClose={() => setToast({ show: false })}
        />
      )}
    </div>
  );
}

export default AdminChat;
