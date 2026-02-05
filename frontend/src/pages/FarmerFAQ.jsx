import { useNavigate } from "react-router-dom";
import FarmerLayout from "../components/FarmerLayout";

function FarmerFAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I start selling on KisanConnect?",
      answer:
        "Create a farmer account, complete your profile details, and then add your first product from the ‘Add Product’ option. Once your product is listed, customers can start placing orders.",
    },
    {
      question: "What details should I add while registering a product?",
      answer:
        "Add a clear product name, category, price per unit, available quantity, and a simple description (quality, variety, packaging). Upload a clean photo so customers can trust what they are buying.",
    },
    {
      question: "How should I decide the right price?",
      answer:
        "Set a price that covers your cost and gives profit, while staying competitive. Consider season, freshness, transport/packing cost, and local market rates. You can update the price later if needed.",
    },
    {
      question: "How do I manage stock so I don’t oversell?",
      answer:
        "Keep your inventory quantity updated. If stock is low, reduce the quantity immediately. If an item is not available today, set it to out of stock or reduce quantity to avoid cancellations and complaints.",
    },
    {
      question: "What happens when a customer places an order?",
      answer:
        "You will see the order in your orders section. Check the items and delivery details, then accept the order if you can fulfill it. After accepting, update the status as you pack and ship.",
    },
    {
      question: "What do the order statuses mean for me as a farmer?",
      answer:
        "Pending means waiting for your decision. Accepted means you confirmed. Packed means you prepared the items. Shipped means it’s sent for delivery. Delivered means completed. Cancelled means the order is stopped.",
    },
    {
      question: "When should I accept or reject an order?",
      answer:
        "Accept when you have the required stock and can deliver on time. Reject if the stock is not available, quality is not good, or delivery is not possible. Quick updates keep customers satisfied.",
    },
    {
      question: "Can I cancel an order after accepting?",
      answer:
        "Try to avoid cancelling after accepting because it reduces trust. If something unavoidable happens (stock loss, transport issue), message the customer and update the order status as early as possible.",
    },
    {
      question: "How can I communicate with customers?",
      answer:
        "Use the built‑in chat for product questions, delivery timing, and clarifications. Friendly, quick replies often lead to repeat customers and better ratings.",
    },
    {
      question: "What should I do if a customer complains?",
      answer:
        "Read the complaint carefully, respond politely, and share your side clearly. If it’s a genuine issue (quality mismatch, delay), propose a fair solution. Admins may review complaints and help resolve them.",
    },
    {
      question: "How do I increase my sales on KisanConnect?",
      answer:
        "Upload clear photos, keep prices fair, maintain accurate stock, respond quickly to messages, and deliver on time. Consistent quality builds ratings and customer trust.",
    },
    {
      question: "How do ratings affect my profile?",
      answer:
        "Ratings help customers decide whom to buy from. Higher ratings improve trust and visibility. Delivering fresh products and good communication increases positive feedback.",
    },
    {
      question: "What if I receive too many orders at once?",
      answer:
        "Update your stock quantity immediately to match what you can fulfill. If needed, temporarily reduce availability so customers don’t place orders you cannot complete.",
    },
    {
      question: "Can I edit or delete a product listing?",
      answer:
        "Yes. You can update product details like price, description, and quantity. If you no longer sell an item, you can remove it to keep your store clean and accurate.",
    },
    {
      question: "How can I avoid cancellations and complaints?",
      answer:
        "Keep inventory accurate, accept only orders you can deliver, pack items carefully, and communicate early if there is any delay. Most issues happen due to late updates or wrong stock information.",
    },
    {
      question: "What delivery practices improve customer trust?",
      answer:
        "Use clean packaging, ensure correct quantity, and avoid mixing damaged items. If possible, confirm delivery timing via chat so customers are prepared.",
    },
    {
      question: "How do I check my earnings?",
      answer:
        "Open the Earnings section to see totals and trends. This helps you understand which products sell better and plan your inventory and pricing accordingly.",
    },
    {
      question: "What if my account gets restricted or deactivated?",
      answer:
        "This can happen due to repeated complaints, policy violations, or suspicious activity. Contact admin through available support channels and provide correct information to resolve the issue.",
    },
    {
      question: "How do I keep my account secure?",
      answer:
        "Use a strong password, don’t share your login, and log out on shared devices. If you suspect misuse, change your password and inform admin/support.",
    },
    {
      question: "What is the best daily routine to manage my store?",
      answer:
        "Update stock in the morning, check new orders regularly, respond to messages quickly, and update order statuses on time. Consistency helps you earn better ratings and repeat customers.",
    },
  ];

  return (
    <FarmerLayout activeTab="">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
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
            Farmer FAQ
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl">
            Simple answers for farmers—products, pricing, orders, delivery, and
            customer communication.
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
              Need more help?
            </h2>
            <p className="text-sm md:text-base text-gray-700">
              Use the in‑app chat for quick questions and keep your stock and
              order status updated regularly. Good communication leads to better
              ratings and repeat customers.
            </p>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}

export default FarmerFAQ;
