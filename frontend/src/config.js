// Centralized configuration for API URLs
// This allows easy switching between development and production

const getApiUrl = () => {
  // Use environment variable if available (set in Vercel/build process)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to localhost for local development
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();

// Helper to get full URL for file uploads/images
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  // If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // Otherwise, prepend API base URL
  return `${API_BASE_URL}${filePath}`;
};

// Helper function for making API calls (for components that don't use api.js)
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export default {
  API_BASE_URL,
  getFileUrl,
  apiFetch,
};
