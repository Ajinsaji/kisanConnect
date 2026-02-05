import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messagingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ChatBox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesData, setMessagesData] = useState({}); // Store last message for each conversation

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messagingAPI.listConversations();
      setConversations(data.slice(0, 3)); // Show top 3 conversations
      
      // Load last message for each conversation
      const messagesPromises = data.slice(0, 3).map(async (conv) => {
        try {
          const messages = await messagingAPI.getMessages(conv.id);
          return { convId: conv.id, lastMessage: messages[messages.length - 1] };
        } catch {
          return { convId: conv.id, lastMessage: null };
        }
      });
      
      const messagesResults = await Promise.all(messagesPromises);
      const messagesMap = {};
      messagesResults.forEach(({ convId, lastMessage }) => {
        messagesMap[convId] = lastMessage;
      });
      setMessagesData(messagesMap);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConversationPartner = (conversation) => {
    if (!user) return { name: "Unknown" };
    if (user.role === "farmer") {
      return conversation.buyer || { name: "Buyer" };
    } else {
      return conversation.farmer || { name: "Farmer" };
    }
  };

  return (
    <div className="border border-primaryDark rounded-lg bg-white shadow-sm h-full flex flex-col">

      {/* Header */}
      <div className="px-4 py-3 flex justify-between bg-primaryDark text-white rounded-t-lg">
        <div>
          <h2 className="text-lg font-semibold">Messages</h2>
          <p className="text-xs opacity-80">Recent chats</p>
        </div>
        <button className="btn-secondary-sm" onClick={()=>navigate("/chat")}>
          View Chats
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 text-sm flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No conversations yet</p>
        ) : (
          conversations.map((conv) => {
            const partner = getConversationPartner(conv);
            const lastMessage = messagesData[conv.id];
            return (
              <div key={conv.id}>
                <p className="font-medium text-primary">{partner.name || "Unknown"}</p>
                <p className="text-gray-600 truncate">
                  {lastMessage ? lastMessage.message_text : "No messages yet"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ChatBox;
