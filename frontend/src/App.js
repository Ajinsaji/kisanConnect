import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import FarmerSignup from './pages/FarmerSignup';
import FarmerDashboard from './pages/FarmerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminFarmers from './pages/AdminFarmers';
import AdminOrders from './pages/AdminOrders';
import AdminChat from './pages/AdminChat';
import AdminComplaints from './pages/AdminComplaints';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import './App.css';
import RegisterProduct from "./pages/RegisterProduct";
import Cart from "./pages/Cartpage";
import Checkout from "./pages/Checkout";
import Chat from "./pages/Chat";
import Inventory from "./pages/Inventory";
import Success from "./pages/Success";
import Orders from "./pages/Orders";
import Earnings from "./pages/Earnings";
import FarmersList from "./pages/FarmersList";
import FarmerOrderDetails from "./pages/FarmerOrderDetails";
import FarmerOrders from "./pages/FarmerOrders";
import GovernmentNewsPage from "./pages/GovernmentNewsPage";
import FAQ from "./pages/FAQ";
import MarketPrices from "./pages/MarketPrices";
import FarmerFAQ from "./pages/FarmerFAQ";
import Negotiation from "./pages/Negotiation";

// ✅ AUTOMATIC TOKEN MIGRATION - Runs once on app startup
const migrateTokenOnStartup = () => {
  const token = localStorage.getItem('token');
  const accessToken = localStorage.getItem('access_token');

  // If we have access_token but no token, migrate it
  if (accessToken && !token) {
    console.log('🔄 Auto-migrating access_token to token...');
    localStorage.setItem('token', accessToken);
    localStorage.removeItem('access_token');
    console.log('✅ Token migration complete');
    return true;
  }

  // If we have both, keep token and remove access_token (cleanup)
  if (accessToken && token) {
    console.log('🧹 Cleaning up duplicate access_token key...');
    localStorage.removeItem('access_token');
  }

  return false;
};

// Run migration immediately when this module loads
migrateTokenOnStartup();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to admin-login if trying to access admin routes
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/admin-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user?.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Smart root route redirect
  const getRootRedirect = () => {
    if (!isAuthenticated) {
      return "/customer-dashboard"; // Public can view products
    }
    // If authenticated, redirect to appropriate dashboard based on role
    if (user?.role === 'admin') {
      return "/admin-dashboard";
    }
    if (user?.role === 'farmer') {
      return "/farmer-dashboard";
    }
    return "/customer-dashboard";
  };
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/farmer-signup" element={<FarmerSignup />} />
      
      {/* Default route - redirect based on authentication and role */}
      <Route 
        path="/" 
        element={<Navigate to={getRootRedirect()} replace />}
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/farmer-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/customer-dashboard" 
        element={<CustomerDashboard />}
      />
      
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin-users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin-farmers" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminFarmers />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin-orders" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOrders />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin-chat" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminChat />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin-complaints" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminComplaints />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/register-product" 
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <RegisterProduct />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/productDetails" element={<ProductDetails />} />
      <Route path="/farmers/:productName" element={<FarmersList />} />
      <Route path="/negotiate/:productId" element={<Negotiation />} />
      
      <Route 
        path="/market-prices" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'farmer']}>
            <MarketPrices />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/government-news" 
        element={
          <ProtectedRoute>
            <GovernmentNewsPage />
          </ProtectedRoute>
        } 
      />

      <Route path="/faq" element={<FAQ />} />
      <Route
        path="/farmer-faq"
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerFAQ />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/cart" 
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <Cart />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <Checkout />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/inventory" 
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <Inventory />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/earnings" 
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <Earnings />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/success" 
        element={
          <ProtectedRoute>
            <Success />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <Orders />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/farmer-orders" 
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerOrders />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/farmer-order/:orderId" 
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerOrderDetails />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
