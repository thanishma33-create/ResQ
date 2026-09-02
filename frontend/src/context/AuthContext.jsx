import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('resq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('resq_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('resq_token');
      if (storedToken) {
        try {
          const res = await axiosClient.get('/api/auth/me');
          setUser(res.data);
          localStorage.setItem('resq_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('resq-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('resq-auth-expired', handleAuthExpired);
  }, []);

  const login = async (username_or_email, password) => {
    const res = await axiosClient.post('/api/auth/login', {
      username_or_email: username_or_email.trim(),
      password,
    });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('resq_token', access_token);
    localStorage.setItem('resq_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (formData) => {
    const res = await axiosClient.post('/api/auth/register', formData);
    // After registration, log in with the new credentials
    return await login(formData.username, formData.password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has universal access
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
