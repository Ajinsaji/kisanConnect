import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { negotiationAPI, productsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Negotiation() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [negotiation, setNegotiation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offerInput, setOfferInput] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [farmerTyping, setFarmerTyping] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const conversationEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    if (user.role !== "buyer") {
      setToast({ show: true, message: "Only buyers can negotiate.", type: "error" });
      navigate(-1);
      return;
    }
    if (productId) load();
  }, [productId, isAuthenticated, user]);

  useEffect(() => {
    if (negotiation || farmerTyping) {
      conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [negotiation?.messages?.length, farmerTyping]);

  const load = async () => {
    try {
      setLoading(true);
      const [prod, neg] = await Promise.all([
        productsAPI.get(parseInt(productId)),
        negotiationAPI.start(parseInt(productId)),
      ]);
      setProduct(prod);
      setNegotiation(neg);
    } catch (err) {
      setToast({ show: true, message: err.message || "Failed to load.", type: "error" });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = async () => {
    const price = parseFloat(offerInput);
    if (isNaN(price) || price <= 0) {
      setToast({ show: true, message: "Enter a valid price (₹/kg).", type: "error" });
      return;
    }
    try {
      setSending(true);
      const res = await negotiationAPI.sendOffer(negotiation.id, price);
      setOfferInput("");
      const msgs = res.negotiation?.messages || [];
      const lastMsg = msgs[msgs.length - 1];
      const farmerReplied = lastMsg && lastMsg.sender_type !== "buyer";
      if (farmerReplied && msgs.length > 0) {
        setNegotiation({ ...res.negotiation, messages: msgs.slice(0, -1) });
        setFarmerTyping(true);
        const delay = 1500 + Math.random() * 1000;
        setTimeout(() => {
          setNegotiation(res.negotiation);
          setFarmerTyping(false);
        }, delay);
      } else {
        setNegotiation(res.negotiation);
      }
      if (res.accepted) {
        setToast({ show: true, message: res.message, type: "success" });
      }
    } catch (err) {
      setToast({ show: true, message: err.message || "Failed to send offer.", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!negotiation?.messages?.length) return;
    try {
      setClearingChat(true);
      const updated = await negotiationAPI.clear(negotiation.id);
      setNegotiation(updated);
      setFarmerTyping(false);
      setToast({ show: true, message: "Chat cleared. You can start over.", type: "info" });
    } catch (err) {
      setToast({ show: true, message: err.message || "Failed to clear chat.", type: "error" });
    } finally {
      setClearingChat(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await negotiationAPI.confirm(negotiation.id);
      setNegotiation((n) => (n ? { ...n, status: "confirmed" } : n));
      setToast({ show: true, message: "Added to cart. Taking you to cart...", type: "success" });
      setTimeout(() => navigate("/cart", { replace: true }), 800);
    } catch (err) {
      setToast({ show: true, message: err.message || "Failed to confirm.", type: "error" });
    } finally {
      setConfirming(false);
    }
  };

  if (loading || !product || !negotiation) {
    return (
      <>
        <CustomerNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  const canSendOffer = negotiation.status === "ongoing";
  const showConfirmButton = negotiation.status === "accepted";

  return (
    <>
      <CustomerNavbar />
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-green-700 hover:text-green-800 font-medium flex items-center gap-2"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 font-medium transition"
            >
              <span>💬</span>
              Messages
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow border p-6 mb-6">
            <h1 className="text-xl font-bold text-gray-800 mb-2">Negotiate price</h1>
            <p className="text-gray-600 font-medium">{product.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Listed: ₹{product.price?.toFixed(2)} per kg
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Conversation</h2>
              {negotiation.messages?.length > 0 && (canSendOffer || showConfirmButton) && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={clearingChat}
                  className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
                >
                  {clearingChat ? "Clearing..." : "Clear chat"}
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {negotiation.messages?.length === 0 && !farmerTyping && (
                <p className="text-gray-500 text-sm">Send your offer below to discuss the price.</p>
              )}
              {negotiation.messages?.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_type === "buyer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      m.sender_type === "buyer"
                        ? "bg-green-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {m.sender_type !== "buyer" && (
                      <span className="text-xs text-gray-500 font-medium block mb-0.5">Farmer</span>
                    )}
                    <span>{m.message_text}</span>
                    {m.offer_amount != null && (
                      <span className={`block text-xs mt-1 ${m.sender_type === "buyer" ? "text-green-100" : "text-gray-500"}`}>
                        ₹{Number(m.offer_amount).toFixed(2)}/kg
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {farmerTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-600 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-gray-500">Farmer is typing...</span>
                  </div>
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>

            {/* Chat-style input bar - only when customer can send offer */}
            {canSendOffer && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={offerInput}
                    onChange={(e) => setOfferInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOffer()}
                    placeholder="Your offer (₹ per kg)..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={handleSendOffer}
                    disabled={sending}
                    className="shrink-0 px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {showConfirmButton && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <p className="font-medium text-amber-900 mb-2">Do you want to confirm this offer?</p>
              <p className="text-sm text-amber-800 mb-4">It will be added to your cart at the agreed price.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {confirming ? "Confirming..." : "Yes, add to cart"}
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 border border-gray-400 text-gray-700 rounded-xl font-semibold"
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      {toast.show && (
        <Toast message={toast.message} type={toast.type} position="center" onClose={() => setToast({ ...toast, show: false })} />
      )}
    </>
  );
}

export default Negotiation;
