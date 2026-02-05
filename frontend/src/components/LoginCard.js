import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

function LoginCard() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <UserIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Please Login</h2>
          <p className="text-gray-600">Sign in to your account to continue shopping</p>
        </div>

        <div className="space-y-3 mb-8">
          {/* Already have account */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <LockClosedIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Already have an account?</p>
              <p className="text-xs text-gray-600 mt-1">Login to access your orders and cart</p>
            </div>
          </div>

          {/* Don't have account */}
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <UserIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Don't have an account?</p>
              <p className="text-xs text-gray-600 mt-1">Create a new account to get started</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Login to Account
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="w-full px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Create New Account
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Choose your account type during signup:
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="text-center text-xs">
              <p className="text-gray-600">👨‍🌾 Farmer</p>
              <p className="text-gray-400 text-xs">Sell products</p>
            </div>
            <div className="text-center text-xs">
              <p className="text-gray-600">🛒 Customer</p>
              <p className="text-gray-400 text-xs">Buy products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginCard;
