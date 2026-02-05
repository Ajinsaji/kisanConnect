import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate inputs before sending
    if (!email || !email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    
    if (!password || !password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        // Redirect based on user role - use the returned user object
        const userData = result.user;
        console.log("Login successful, user data:", userData);
        
        if (userData && userData.role) {
          console.log("User role:", userData.role);
          if (userData.role === 'admin') {
            navigate("/admin-dashboard");
          } else if (userData.role === 'farmer') {
            navigate("/farmer-dashboard");
          } else if (userData.role === 'buyer') {
            navigate("/customer-dashboard");
          } else {
            navigate("/");
          }
        } else {
          console.error("User role not found in response");
          setError("Unable to determine user role. Please try again.");
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="w-[420px] bg-white p-10 rounded-lg shadow-md border-l-8 border-r-8 border-green-700">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-green-800 text-center">
            Welcome Back
          </h2>
          <p className="text-center text-gray-600 text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded-md font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer Links */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{" "}
          <span
            className="text-green-700 font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
