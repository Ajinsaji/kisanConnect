import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Footer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <footer className="w-full bg-white border-t border-green-200 mt-10">
      <div className="mx-4 md:mx-14 px-5 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
        {/* App Info */}
        <div>
          <h2 className="text-lg font-semibold text-primary">
            Kissan Connect
          </h2>
          <p className="mt-1">
            Connecting farmers directly to consumers with a transparent digital
            marketplace.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Quick Links
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => navigate("/customer-dashboard")}
                className="hover:text-green-700 transition-colors"
              >
                Browse Products
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/farmer-signup")}
                className="hover:text-green-700 transition-colors"
              >
                Become a Farmer on KisanConnect
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/faq")}
                className="hover:text-green-700 transition-colors"
              >
                FAQ – How KisanConnect Works
              </button>
            </li>
            {user?.role === "farmer" && (
              <li>
                <button
                  onClick={() => navigate("/farmer-faq")}
                  className="hover:text-green-700 transition-colors"
                >
                  Farmer FAQ – Selling on KisanConnect
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Help & Support */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Help &amp; Support
          </h3>
          <p className="text-xs md:text-sm">
            For issues with orders or communication between farmers and
            customers, use the in‑app chat or complaints features so admins can
            help quickly.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
