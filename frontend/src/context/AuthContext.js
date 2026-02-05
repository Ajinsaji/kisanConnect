import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, isTimeLockError } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // ✅ AUTOMATIC TOKEN MIGRATION - Runs on every app load
  const migrateToken = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token');
    
    // If we have access_token but no token, migrate it
    if (accessToken && !token) {
      console.log('🔄 Migrating access_token to token...');
      localStorage.setItem('token', accessToken);
      localStorage.removeItem('access_token');
      console.log('✅ Token migration complete');
      return accessToken;
    }
    
    // If we have both, keep token and remove access_token
    if (accessToken && token) {
      console.log('🧹 Cleaning up duplicate access_token key...');
      localStorage.removeItem('access_token');
    }
    
    return token || null;
  };
  
  // Run migration immediately on mount
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Run migration on initial state
    return migrateToken();
  });
  const [loading, setLoading] = useState(true);
  
  // Also run migration in useEffect to catch any late changes
  useEffect(() => {
    const migratedToken = migrateToken();
    if (migratedToken && migratedToken !== token) {
      setToken(migratedToken);
    }
  }, []); // Run once on mount

  // Load user profile when token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await userAPI.getProfile();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          if (!isTimeLockError(error)) console.error('Failed to load user:', error);
          logout();
        }
      } else {
        // Try to load from localStorage if token doesn't exist but user data does
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
      setLoading(false);
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      // ✅ CRITICAL: Extract access_token from response
      const newToken = response.access_token || response.token;
      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      setToken(newToken);
      // ✅ Always save as 'token' (not 'access_token')
      localStorage.setItem('token', newToken);
      // Clean up any old 'access_token' key
      localStorage.removeItem('access_token');
      
      // Load user profile
      const userData = await userAPI.getProfile();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const newUser = await authAPI.register(userData);
      // After registration, automatically login
      const response = await authAPI.login(userData.email, userData.password);
      // ✅ CRITICAL: Extract access_token from response
      const newToken = response.access_token || response.token;
      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      setToken(newToken);
      // ✅ Always save as 'token' (not 'access_token')
      localStorage.setItem('token', newToken);
      // Clean up any old 'access_token' key
      localStorage.removeItem('access_token');
      
      // Load full user profile
      const userProfile = await userAPI.getProfile();
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
      
      return { success: true, user: userProfile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('access_token'); // Clear both for safety
    localStorage.removeItem('user');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
