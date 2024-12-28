// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../services/api';
import { message as AntMessage } from 'antd';
import jwtDecode from 'jwt-decode';

// Vytvoření kontextu
const AuthContext = createContext();

// Hook pro snadný přístup k AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Poskytovatel kontextu
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, role, token }
  const [loading, setLoading] = useState(true);

  // Načtení uživatele z localStorage při načtení aplikace
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          email: decoded.email,
          role: decoded.role,
          token,
        });
      } catch (error) {
        console.error('Chyba při dekódování tokenu:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Funkce pro přihlášení
  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password);
      const { token } = data;
      const decoded = jwtDecode(token);
      const userData = {
        email: decoded.email,
        role: decoded.role,
        token,
      };
      setUser(userData);
      localStorage.setItem('token', token);
      AntMessage.success('Úspěšně přihlášen');
      return { success: true };
    } catch (error) {
      console.error('Chyba při přihlášení:', error);
      AntMessage.error(error.response?.data?.message || 'Přihlášení se nezdařilo');
      return { success: false, message: error.response?.data?.message || 'Přihlášení se nezdařilo' };
    }
  };

  // Funkce pro odhlášení
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    AntMessage.info('Úspěšně odhlášen');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
