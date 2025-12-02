import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Set the token in API interceptor
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        // Clear invalid data
        console.error('Invalid user data in localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        api.defaults.headers.common['Authorization'] = '';
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Clear any previous session data before logging in
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      // Set new token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update API interceptor with new token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      
      return userData;
    } catch (error) {
      // Clear any partial data on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      
      // Note: For registration, we're NOT auto-logging in
      // The user needs to login after registration
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Remove all auth-related items from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('googleId');
    localStorage.removeItem('authMethod');
    
    // Clear the user state
    setUser(null);
    
    // Reset API interceptor by removing the token
    api.defaults.headers.common['Authorization'] = '';
    
    // Force a redirect to login
    window.location.href = '/login';
  };

  const setUserData = (userData, token) => {
    console.log('setUserData called with:', { userData: userData?._id, hasToken: !!token });
    
    // Clear previous session first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Set both localStorage AND state immediately
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Token saved to localStorage and interceptor');
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('User saved to localStorage and state:', userData._id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
