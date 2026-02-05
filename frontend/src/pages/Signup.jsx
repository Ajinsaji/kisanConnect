import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        ...formData,
        role: "buyer", // Customer/Buyer role
      });

      if (result.success) {
        navigate("/customer-dashboard");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="w-[460px] bg-white p-10 rounded-lg shadow-md border-l-8 border-green-700">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-green-800">
              Customer Registration
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Buy straight from farm
            </p>
          </div>
          <span className="text-xs text-gray-400">{step}/3</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            {/* STEP 1 — Name */}
            <div className={`step-wrapper ${step === 1 ? "step-open" : "step-closed"}`}>
              <div className="step-content space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name}
                  className="w-full bg-green-700 text-white py-2 rounded-md font-semibold hover:bg-green-800 transition disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>

            {/* STEP 2 — Contact + Password */}
            <div className={`step-wrapper ${step === 2 ? "step-open" : "step-closed"}`}>
              <div className="step-content space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 border border-green-700 text-green-700 py-2 rounded-md"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!formData.email || !formData.password}
                    className="w-2/3 bg-green-700 text-white py-2 rounded-md font-semibold hover:bg-green-800 transition disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3 — Address */}
            <div className={`step-wrapper ${step === 3 ? "step-open" : "step-closed"}`}>
              <div className="step-content space-y-4">
                <textarea
                  placeholder="Address (Optional)"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                  rows="3"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 border border-green-700 text-green-700 py-2 rounded-md"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-green-700 text-white py-2 rounded-md font-semibold hover:bg-green-800 transition disabled:opacity-50"
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Already registered?{" "}
          <span
            className="text-green-700 font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Sign in
          </span>
        </p>
        <p className="text-center text-gray-600 text-sm mt-1">
          Are you a farmer?{" "}
          <span
            className="text-green-700 font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/farmer-signup")}
          >
            Sign up as Farmer
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
