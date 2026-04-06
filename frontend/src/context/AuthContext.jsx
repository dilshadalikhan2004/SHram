import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Accepts a clean payload object — caller decides what fields to include
  const login = async (payload) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, payload);
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const sendOtp = async (phone) => {
    await axios.post(`${API_URL}/api/auth/otp/send`, { phone });
    return true;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    const { access_token, user: newUser } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const switchRole = async (newRole) => {
    const response = await axios.patch(`${API_URL}/api/auth/role`, { role: newRole });
    if (response.data.role) {
      setUser(prev => ({ ...prev, role: response.data.role }));
    }
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, sendOtp, register, logout, updateUser, switchRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
