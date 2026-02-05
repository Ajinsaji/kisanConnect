import React from "react";
import FarmerNavbar from "./FarmerNavbar";
import Footer from "./Footer";

/**
 * Layout wrapper for farmer pages with left sidebar navigation
 * Automatically adds proper spacing for the fixed sidebar on desktop
 */
function FarmerLayout({ children, activeTab = "dashboard", showFooter = true }) {
  return (
    <div className="min-h-screen bg-[#f3f7f4]">
      <FarmerNavbar activeTab={activeTab} />
      
      {/* Main content area - offset for sidebar on desktop */}
      <div className="md:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}

export default FarmerLayout;
