import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FarmerSignup() {
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
    city: "",
    state: "",
    postal_code: "",
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
      setError("Please fill in all required fields (Name, Email, Password)");
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        ...formData,
        role: "farmer",
      });

      if (result.success) {
        navigate("/farmer-dashboard");
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
      <div className="w-[460px] bg-white p-10 rounded-lg shadow-md border-r-8 border-green-700">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-green-800">
              Farmer Registration
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Complete your profile to get started.
            </p>
          </div>
          <span className="text-xs text-gray-400">{step}/4</span>
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
            {/* STEP 1: NAME */}
            <div className={`step-wrapper ${step === 1 ? "step-open" : "step-closed"}`}>
              <div className="step-content space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name}
                  className="w-full bg-green-700 text-white py-2 rounded-md disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>

            {/* STEP 2: EMAIL & PASSWORD */}
            <div className={`step-wrapper ${step === 2 ? "step-open" : "step-closed"}`}>
              <div className="step-content space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />

                <label className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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

                <label className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 border py-2 rounded-md"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!formData.email || !formData.password}
                    className="w-2/3 bg-green-700 text-white py-2 rounded-md disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3: ADDRESS */}
            <div className={`step-wrapper ${step === 3 ? "step-open" : "step-closed"}`}>
              <div className="step-content space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Address <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  placeholder="Your farm address or location"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                  rows="3"
                />

                <label className="block text-sm font-medium text-gray-700">
                  City <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Your city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 border py-2 rounded-md"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-2/3 bg-green-700 text-white py-2 rounded-md"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 4: STATE & POSTAL CODE */}
            <div className={`step-wrapper ${step === 4 ? "step-open" : "step-closed"}`}>
              <div className="step-content space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  State <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Your state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />

                <label className="block text-sm font-medium text-gray-700">
                  Postal Code <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Your postal code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange("postal_code", e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-1/3 border py-2 rounded-md"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-green-700 text-white py-2 rounded-md disabled:opacity-50"
                  >
                    {loading ? "Registering..." : "Complete Registration"}
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
          Not a farmer?{" "}
          <span
            className="text-green-700 font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Create customer account
          </span>
        </p>
      </div>
    </div>
  );
}

export default FarmerSignup;
