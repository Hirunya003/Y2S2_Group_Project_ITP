import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// API base URL - default to localhost if not specified
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on app load
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (localStorage.getItem('userInfo')) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setUser(userInfo);
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Memoize fetchUserProfile to prevent infinite loops
  const fetchUserProfile = useCallback(async () => {
    if (!user || !user.token) {
      console.error('Cannot fetch profile: No user or token available');
      return { success: false, message: 'Not authenticated' };
    }
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      console.log(`Fetching user profile from: ${API_BASE_URL}/api/auth/profile`);
      const { data } = await axios.get(`${API_BASE_URL}/api/auth/profile`, config);
      console.log("Profile data received:", data);
      
      // Ensure data has an address object to prevent errors
      if (!data.address) {
        data.address = {};
      }
      
      // Update the local state and storage with latest data
      const updatedUserInfo = {
        ...data,
        token: user.token,
        phone: data.phone || '',
        address: data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        }
      };
      
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      setUser(updatedUserInfo);
      
      return { success: true, data: updatedUserInfo };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return { 
        success: false, 
        message: error.response && error.response.data.message 
          ? error.response.data.message 
          : error.message || 'Failed to fetch profile. Check server connection.'
      };
    }
  }, [user]); // Only depend on user object

  // Register user
  const register = async (userData) => {
    try {
      console.log(`Attempting to register user at: ${API_BASE_URL}/api/auth/register`);
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response && error.response.data.message 
          ? error.response.data.message 
          : error.message || 'Server connection failed. Please ensure the backend is running.'
      };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      console.log(`Attempting to login at: ${API_BASE_URL}/api/auth/login`);
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response && error.response.data.message 
          ? error.response.data.message 
          : error.message || 'Server connection failed. Please ensure the backend is running.'
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
  };

  // Update profile
  const updateProfile = async (userData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(`${API_BASE_URL}/api/auth/profile`, userData, config);
      localStorage.setItem('userInfo', JSON.stringify({
        ...data,
        token: user.token
      }));
      setUser({
        ...data,
        token: user.token
      });
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response && error.response.data.message 
          ? error.response.data.message 
          : error.message || 'Server connection failed. Please ensure the backend is running.'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateProfile,
      fetchUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
