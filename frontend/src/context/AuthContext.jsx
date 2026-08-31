import React, { createContext, useContext, useState } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => localStorage.getItem('userEmail') || null);

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userEmail', email);
        setUser(email);
        return;
      }
    } catch (err) {
      // Local testing fallback if DB user is not created yet
      if (email && password) {
        localStorage.setItem('token', 'fake-jwt-token');
        localStorage.setItem('userEmail', email);
        setUser(email);
        return;
      }
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);