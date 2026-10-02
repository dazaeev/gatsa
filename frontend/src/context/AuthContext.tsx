'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  branch?: string;
  role: 'ROLE_CLIENT' | 'ROLE_PARTNER' | 'ROLE_ADMIN' | 'ROLE_SUPER_ADMIN' | 'ROLE_GERENTE_SUCURSAL' | 'ROLE_AGENTE_COMPLETO' | 'ROLE_OPERADOR_IMSS' | string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('gatsa_token');
      const savedUser = localStorage.getItem('gatsa_user');
      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gatsa_token', newToken);
      localStorage.setItem('gatsa_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gatsa_token');
      localStorage.removeItem('gatsa_user');
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
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
