import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AdminNavbar from "../components/AdminNavbar";
import CustomerNavbar from "../components/CustomerNavbar";
import FarmerNavbar from "../components/FarmerNavbar";
import Toast from "../components/Toast";
import { messagingAPI, cartAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [adminMessages, setAdminMessages] = useState([]);
  const [showAdminMessages, setShowAdminMessages] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    loadConversations();
    if (user?.role === "buyer") {
      loadCartCount();
    }
    if (user?.role === "farmer") {
      loadAdminMessages();
      loadAdminUnreadCount();
      // Refresh admin messages every 5 seconds
      const interval = setInterval(() => {
        loadAdminMessages();
        loadAdminUnreadCount();
      }, 5000);
      return () => clearInterval(interval);
    }

    // If coming from admin "Free to Ask" button, open group chat directly
    const groupParam = searchParams.get("group");
    if (groupParam === "free-to-ask") {
      setShowGroupChat(true);
    }
  }, [user, searchParams]);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const loadCartCount = async () => {
    try {
      const cartData = await cartAPI.get();
      setCartCount(cartData?.items?.length || 0);
    } catch (err) {
      console.error('Failed to load cart count:', err);
    }
  };

  useEffect(() => {
    if (activeConversation && !showGroupChat) {
      loadMessages(activeConversation.id);
      markMessagesAsRead(activeConversation.id);
      const interval = setInterval(() => {
        loadMessages(activeConversation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation, showGroupChat]);

  useEffect(() => {
    if (showGroupChat && user && (user.role === "farmer" || user.role === "admin")) {
      loadGroupChat();
    }
  }, [showGroupChat, user]);

  const loadConversations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await messagingAPI.listConversations();
      setConversations(data);
      
      // Check if there's a conversation_id in the URL
      const conversationIdParam = searchParams.get("conversation_id");
      if (conversationIdParam) {
        const conversationId = parseInt(conversationIdParam);
        const targetConversation = data.find(conv => conv.id === conversationId);
        if (targetConversation) {
          setActiveConversation(targetConversation);
        } else if (data.length > 0) {
          setActiveConversation(data[0]);
        }
      } else if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load conversations");
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupChat = async () => {
    if (!user || (user.role !== "farmer" && user.role !== "admin")) return;
    setGroupLoading(true);
    try {
      const data = await messagingAPI.getDefaultFarmerGroup();
      setGroupInfo(data.group);
      setGroupMembers(data.members || []);
      setGroupMessages(data.messages || []);
      setError("");
      // Mark group as seen so notification counter updates
      if (data.group?.id) {
        try {
          await messagingAPI.markGroupAsSeen(data.group.id);
          window.dispatchEvent(new Event("groupChatSeen"));
        } catch (e) {
          console.debug("Mark group as seen failed:", e);
        }
      }
    } catch (err) {
      console.error("Error loading group chat:", err);
      setError(err.message || "Failed to load group chat");
    } finally {
      setGroupLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await messagingAPI.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      await messagingAPI.markConversationRead(conversationId);
      // Reload unread count in parent components by triggering a custom event
      window.dispatchEvent(new Event('messagesRead'));
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending || uploadingFile) return;

    // Group chat path
    if (showGroupChat && groupInfo) {
      setSending(true);
      try {
        let fileUrl = null;
        let fileType = null;
        let fileName = null;

        if (selectedFile && (user?.role === "farmer" || user?.role === "admin")) {
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

        await messagingAPI.sendGroupMessage(
          groupInfo.id,
          newMessage.trim() || (selectedFile ? `Sent ${fileName}` : ""),
          fileUrl,
          fileType,
          fileName
        );
        setNewMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Reload group messages
        await loadGroupChat();
      } catch (err) {
        showToast(err.message || "Failed to send message", "error");
      } finally {
        setSending(false);
        setUploadingFile(false);
      }
      return;
    }

    // Direct conversation path
    if (!activeConversation) return;

    setSending(true);
    try {
      // Upload file if selected (only farmers can send files)
      let fileUrl = null;
      let fileType = null;
      let fileName = null;
      
      if (selectedFile && user?.role === "farmer") {
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

      await messagingAPI.sendMessage(
        activeConversation.id,
        newMessage.trim() || (selectedFile ? `Sent ${fileName}` : ""),
        fileUrl,
        fileType,
        fileName
      );
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Reload messages
      await loadMessages(activeConversation.id);
    } catch (err) {
      showToast(err.message || "Failed to send message", "error");
    } finally {
      setSending(false);
      setUploadingFile(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!groupInfo || user?.role !== "admin") return;
    if (memberUserId === user?.id) return;
    try {
      await messagingAPI.removeGroupMember(groupInfo.id, memberUserId);
      showToast("Member removed from group", "success");
      await loadGroupChat();
    } catch (err) {
      showToast(err.message || "Failed to remove member", "error");
    }
  };

  const loadAdminMessages = async () => {
    if (user?.role !== "farmer") return;
    try {
      const data = await messagingAPI.getAdminMessages();
      setAdminMessages(data);
    } catch (err) {
      console.error("Error loading admin messages:", err);
    }
  };

  const loadAdminUnreadCount = async () => {
    if (user?.role !== "farmer") return;
    try {
      const data = await messagingAPI.getAdminMessagesUnreadCount();
      setAdminUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("Error loading admin unread count:", err);
    }
  };

  const getConversationPartner = (conversation) => {
    if (!user) return { name: "Unknown" };
    if (user.role === "buyer") {
      return conversation.farmer || { name: "Farmer" };
    } else {
      return conversation.buyer || { name: "Buyer" };
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
      <div className="min-h-screen flex flex-col bg-light">
        {user?.role === "admin" ? (
          <AdminNavbar title="Messages" activeTab="chat" />
        ) : user?.role === "farmer" ? (
          <FarmerNavbar title="Messages" activeTab="messages" />
        ) : (
          <CustomerNavbar title="Messages" cartCount={cartCount} />
        )}
        <div className={`flex-1 px-5 py-6 ${user?.role === "farmer" ? "md:ml-64" : "mx-14"}`}>
          <p className="text-center py-10">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-light">
        {user?.role === "admin" ? (
          <AdminNavbar title="Messages" activeTab="chat" />
        ) : user?.role === "farmer" ? (
          <FarmerNavbar title="Messages" activeTab="messages" />
        ) : (
          <CustomerNavbar title="Messages" cartCount={cartCount} />
        )}

        <div className={`flex-1 px-5 py-6 ${user?.role === "farmer" ? "md:ml-64" : "mx-14"}`}>
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-4 font-medium transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Admin Messages Section for Farmers */}
          {user?.role === "farmer" && (
            <div className="mb-6 bg-white border border-green-200 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const willShow = !showAdminMessages;
                      setShowAdminMessages(willShow);
                      if (willShow) {
                        await loadAdminMessages();
                        await loadAdminUnreadCount();
                      }
                    }}
                    className="text-lg font-semibold text-gray-800 hover:text-green-700 transition"
                  >
                    {showAdminMessages ? "Hide" : "Show"} Admin Messages
                  </button>
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-1 rounded-full">
                    {adminMessages.length} message{adminMessages.length !== 1 ? "s" : ""}
                  </span>
                  {adminUnreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {adminUnreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowGroupChat((prev) => !prev)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {showGroupChat ? "Back to Direct Chats" : "Ask Forum"}
                </button>
              </div>
              
              {showAdminMessages && (
                <div className="mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> These are official messages from the admin. You can view them but cannot reply.
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {adminMessages.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No messages from admin yet</p>
                    ) : (
                      adminMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`${getMessageTypeColor(msg.message_type)} text-white rounded-lg p-4`}
                        >
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
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            {/* CHAT MESSAGES – 2/3 */}
            <div className="col-span-8 bg-white border border-green-200 rounded-lg shadow-sm flex flex-col">
              {/* Chat Header */}
              {showGroupChat && (user?.role === "farmer" || user?.role === "admin") ? (
                <>
                  <div className="px-6 py-4 border-b bg-primaryDark text-white rounded-t-lg">
                    <h2 className="text-xl font-semibold mb-1">
                      {groupInfo?.name || "Free to Ask"}
                    </h2>
                    <p className="text-sm text-white/90">
                      Group chat with all farmers and admin. Feel free to ask questions and share updates.
                    </p>
                  </div>

                  {/* Group Messages */}
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto text-sm max-h-[500px]">
                    {groupLoading ? (
                      <p className="text-center text-gray-500 py-4">
                        Loading group messages...
                      </p>
                    ) : groupMessages.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No messages yet. Start the discussion!
                      </p>
                    ) : (
                      groupMessages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        const sender = groupMembers.find((m) => m.user_id === msg.sender_id);
                        const senderName = sender?.user?.name || (isMe ? "You" : "Unknown");
                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${
                              isMe
                                ? "ml-auto bg-primary text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <div className="text-xs font-medium opacity-90 mb-1">
                              {senderName}
                            </div>
                            {msg.message_text && <p>{msg.message_text}</p>}
                            {msg.file_url && (
                              <div className="mt-2">
                                {msg.file_type === "image" ? (
                                  <img
                                    src={`http://localhost:8000${msg.file_url}`}
                                    alt={msg.file_name || "Image"}
                                    className="max-w-full rounded-lg"
                                  />
                                ) : (
                                  <a
                                    href={`http://localhost:8000${msg.file_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs underline inline-block mt-1 ${
                                      isMe ? "text-white/90" : "text-blue-600"
                                    }`}
                                  >
                                    📄 {msg.file_name || "Download Document"}
                                  </a>
                                )}
                              </div>
                            )}
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input for group (admin and farmer can send) */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    {selectedFile && (
                      <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700 flex-1">
                          📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <label className="cursor-pointer flex items-center px-3 py-2 border rounded-md hover:bg-gray-50">
                        <PaperClipIcon className="w-5 h-5 text-gray-600" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to the group..."
                        className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none"
                        disabled={sending || uploadingFile}
                      />
                      <button
                        type="submit"
                        disabled={sending || uploadingFile || (!newMessage.trim() && !selectedFile)}
                        className="btn-primary-sm px-6 py-2 disabled:opacity-50"
                      >
                        {uploadingFile ? "Uploading..." : sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              ) : activeConversation ? (
                <>
                  <div className="px-6 py-4 border-b bg-primaryDark text-white rounded-t-lg">
                    <h2 className="text-xl font-semibold mb-3">
                      {getConversationPartner(activeConversation).name || "Unknown"}
                    </h2>
                    {user?.role === "buyer" && activeConversation.farmer && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/90">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">Email:</span>
                          <span className="break-all">{activeConversation.farmer.email || "N/A"}</span>
                        </div>
                        {activeConversation.farmer.phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">Phone:</span>
                            <span className="tracking-widest">xxxxxxxxxx</span>
                            <a
                              href={`tel:${activeConversation.farmer.phone}`}
                              className="ml-2 text-white/90 hover:text-white underline text-xs"
                            >
                              📞 Call
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {user?.role === "farmer" && activeConversation.buyer && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/90">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">Email:</span>
                          <span className="break-all">{activeConversation.buyer.email || "N/A"}</span>
                        </div>
                        {activeConversation.buyer.phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">Phone:</span>
                            <span className="tracking-widest">xxxxxxxxxx</span>
                            <a
                              href={`tel:${activeConversation.buyer.phone}`}
                              className="ml-2 text-white/90 hover:text-white underline text-xs"
                            >
                              📞 Call
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto text-sm max-h-[500px]">
                    {messages.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</p>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        const isSystem = msg.message_type === "system";
                        const isCounterOffer = msg.message_type === "counter_offer" && msg.counter_offer;
                        const offer = msg.counter_offer;

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <div className="max-w-[85%] px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-center">
                                <p className="font-medium">Special offer for you</p>
                                <p className="text-sm mt-1">{msg.message_text}</p>
                                <div className="text-xs mt-2 opacity-75">{new Date(msg.created_at).toLocaleTimeString()}</div>
                              </div>
                            </div>
                          );
                        }

                        if (isCounterOffer) {
                          return (
                            <div
                              key={msg.id}
                              className={`max-w-[70%] px-4 py-3 rounded-lg ${
                                isMe ? "ml-auto bg-primary text-white" : "bg-amber-50 border border-amber-200 text-gray-800"
                              }`}
                            >
                              <p className="font-medium">{msg.message_text}</p>
                              {offer && (
                                <div className="mt-2 text-xs space-y-1">
                                  <p>{offer.product_name && `${offer.product_name} • `}{offer.quantity} kg @ ₹{offer.price_per_unit}/kg (listed: ₹{offer.original_price_per_unit}/kg)</p>
                                  {offer.status === "accepted" && (
                                    <p className="text-green-600 font-medium mt-1">Offer accepted — special price for this customer</p>
                                  )}
                                  {offer.status === "rejected" && (
                                    <p className="text-gray-500 mt-1">Offer rejected</p>
                                  )}
                                </div>
                              )}
                              <div className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${
                              isMe ? "ml-auto bg-primary text-white" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {msg.message_text && <p>{msg.message_text}</p>}
                            {msg.file_url && (
                              <div className="mt-2">
                                {msg.file_type === "image" ? (
                                  <img
                                    src={`http://localhost:8000${msg.file_url}`}
                                    alt={msg.file_name || "Image"}
                                    className="max-w-full rounded-lg"
                                  />
                                ) : (
                                  <a
                                    href={`http://localhost:8000${msg.file_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs underline inline-block mt-1 ${isMe ? "text-white/90" : "text-blue-600"}`}
                                  >
                                    📄 {msg.file_name || "Download Document"}
                                  </a>
                                )}
                              </div>
                            )}
                            <div className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    {selectedFile && (
                      <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700 flex-1">
                          📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      {user?.role === "farmer" && (
                        <label className="cursor-pointer flex items-center px-3 py-2 border rounded-md hover:bg-gray-50">
                          <PaperClipIcon className="w-5 h-5 text-gray-600" />
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            className="hidden"
                          />
                        </label>
                      )}
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none"
                        disabled={sending || uploadingFile}
                      />
                      <button
                        type="submit"
                        disabled={sending || uploadingFile || (!newMessage.trim() && !selectedFile)}
                        className="btn-primary-sm px-6 py-2 disabled:opacity-50"
                      >
                        {uploadingFile ? "Uploading..." : sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a conversation to start chatting
                </div>
              )}
            </div>

            {/* CONTACT LIST or GROUP MEMBERS – 1/3 */}
            <div className="col-span-4 bg-white border border-green-200 rounded-lg shadow-sm">
              {showGroupChat && (user?.role === "farmer" || user?.role === "admin") ? (
                <>
                  <div className="px-6 py-4 border-b bg-primaryDark text-white rounded-t-lg">
                    <h2 className="text-lg font-semibold">Group Members</h2>
                    <p className="text-xs text-white/90 mt-1">
                      {groupMembers.length} member{groupMembers.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {groupMembers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No members yet
                      </div>
                    ) : (
                      groupMembers.map((m) => (
                        <div
                          key={m.id}
                          className="p-4 flex items-center justify-between gap-2 hover:bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate">
                              {m.user?.name || "Unknown"}
                            </h3>
                            <p className="text-xs text-gray-500 capitalize">
                              {m.role}
                              {m.user?.email && ` • ${m.user.email}`}
                            </p>
                          </div>
                          {user?.role === "admin" && m.role !== "admin" && m.user_id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="shrink-0 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="px-6 py-4 border-b bg-primaryDark text-white rounded-t-lg">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                  </div>
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No conversations yet
                      </div>
                    ) : (
                      conversations.map((conv) => {
                        const partner = getConversationPartner(conv);
                        const isActive = activeConversation?.id === conv.id;
                        return (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={`p-4 cursor-pointer hover:bg-light ${
                              isActive ? "bg-light" : ""
                            }`}
                          >
                            <h3 className="font-medium text-gray-800">
                              {partner.name || "Unknown"}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {user?.role === "buyer" ? "Farmer" : "Buyer"}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
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
      </div>
    </>
  );
}

export default Chat;
