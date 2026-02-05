import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "What is KisanConnect?",
      answer:
        "KisanConnect is a marketplace where you can buy fresh farm products directly from farmers. You can browse items, place orders, and contact farmers in one app.",
    },
    {
      question: "How do I place an order?",
      answer:
        "Browse products, open a product to check details, add the quantity you want to your cart, then go to checkout and confirm your delivery details. After placing the order, you can track it from your orders page.",
    },
    {
      question: "Do I need to create an account to order?",
      answer:
        "Yes. You can browse without an account, but you must sign up and log in to place an order, view order history, chat, or raise a complaint.",
    },
    {
      question: "How do I know the products are fresh?",
      answer:
        "Products are listed by farmers with details like category and description. You can also check farmer ratings and use chat to ask questions (harvest date, storage, delivery timing) before ordering.",
    },
    {
      question: "Can I contact the farmer before buying?",
      answer:
        "Yes. You can use the in‑app chat to ask about freshness, quantity, pricing, delivery time, or any special requirements.",
    },
    {
      question: "What delivery details do I need to provide?",
      answer:
        "At checkout, you will provide your delivery address and the required contact details. Make sure your phone number and address are correct to avoid delays.",
    },
    {
      question: "How can I track my order?",
      answer:
        "After ordering, open your orders page to see the latest status. Farmers update the status as the order moves from pending to accepted/packed/shipped/delivered.",
    },
    {
      question: "What does each order status mean?",
      answer:
        "Pending means the farmer hasn’t confirmed yet. Accepted means the farmer confirmed your order. Packed means it’s prepared. Shipped means it’s on the way. Delivered means completed. Cancelled means the order was stopped.",
    },
    {
      question: "Can I cancel my order?",
      answer:
        "Yes, in most cases. You can cancel from your orders section (especially while the order is still pending). If the order is already packed or shipped, cancellation may not be possible—use chat or raise a complaint for help.",
    },
    {
      question: "What if the farmer rejects my order?",
      answer:
        "If an order is rejected, it will be updated in your orders list. You can place a new order from another farmer or message the farmer to understand availability and timing.",
    },
    {
      question: "What if I receive damaged or low‑quality items?",
      answer:
        "If the product quality is not as expected, raise a complaint from the order and add a clear description of the issue. You can also message the farmer to resolve quickly.",
    },
    {
      question: "How do refunds or replacements work?",
      answer:
        "Refunds or replacements depend on the situation and the farmer/admin decision after reviewing your complaint. Provide accurate details so the issue can be resolved fairly.",
    },
    {
      question: "Are prices fixed or can they change?",
      answer:
        "Prices are set by farmers and can change based on season, stock, and market conditions. Always check the product page for the latest price before ordering.",
    },
    {
      question: "Why do I sometimes see ‘out of stock’ or missing items?",
      answer:
        "Farm products are seasonal and availability can change quickly. Farmers update inventory, and products may become unavailable if stock finishes.",
    },
    {
      question: "Can I order from multiple farmers in one cart?",
      answer:
        "Yes, you can add products to your cart. If items are from different farmers, your order experience may involve multiple deliveries or separate order handling depending on how the platform processes it.",
    },
    {
      question: "Can I change my delivery address after ordering?",
      answer:
        "If you need to change the address, message the farmer immediately. If the order is already packed or shipped, changes may not be possible.",
    },
    {
      question: "How do ratings help me as a customer?",
      answer:
        "Ratings help you choose trustworthy farmers. After delivery, leaving honest feedback helps other customers and encourages better service.",
    },
    {
      question: "Is my personal information safe?",
      answer:
        "Your account information is used only for order and communication needs (like delivery and support). You should keep your password private and log out from shared devices.",
    },
    {
      question: "What should I do if the app shows ‘Unauthorized’ or logs me out?",
      answer:
        "This usually happens when your login session expires. Log in again, then retry. If the problem continues, clear the browser cache or contact support/admin through the app.",
    },
    {
      question: "How do I get help quickly?",
      answer:
        "Use chat for quick questions to the farmer. For serious issues (wrong item, missing item, quality problem, or delay), raise a complaint from your order so admins can track and resolve it.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-50">
      <Navbar title="Frequently Asked Questions" />

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm md:text-base text-green-800 mb-4 hover:text-green-900 group"
        >
          <span className="mr-1 text-lg group-hover:-translate-x-0.5 transition-transform">
            ←
          </span>
          <span>Back</span>
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100 p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl">
            Simple answers to common questions for customers—ordering, delivery,
            tracking, quality issues, and support.
          </p>

          <div className="space-y-5">
            {faqs.map((item, idx) => (
              <div
                key={idx}
                className="border border-green-100 rounded-xl bg-white hover:border-green-300 transition-colors"
              >
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer px-4 md:px-5 py-3 md:py-4">
                    <span className="font-semibold text-green-900 text-sm md:text-base">
                      {item.question}
                    </span>
                    <span className="ml-4 text-green-600 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="px-4 md:px-5 pb-4 text-sm md:text-base text-gray-700 border-t border-green-50 space-y-2">
                    <p>{item.answer}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 md:p-5 rounded-xl bg-green-50 border border-green-100">
            <h2 className="font-semibold text-green-900 mb-1">
              Still have questions?
            </h2>
            <p className="text-sm md:text-base text-gray-700 mb-2">
              You can use the in‑app chat or complaints section to contact
              farmers or admins directly. Clear communication helps everyone in
              the marketplace.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default FAQ;

