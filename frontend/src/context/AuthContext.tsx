import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string) => Promise<string>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUserCredits: (newCredits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed && (parsed.credits === undefined || parsed.credits === null)) {
        parsed.credits = 100;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const updateUserCredits = (newCredits: number) => {
    setUser((prev) => (prev ? { ...prev, credits: newCredits } : null));
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      const normalizedUser = {
        ...userData,
        credits: userData.credits ?? 100,
      };
      setToken(accessToken);
      setUser(normalizedUser);
    } finally {
      setLoading(false);
    }
  };



  const registerUser = async (name: string, email: string, password: string): Promise<string> => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { accessToken, user: userData, message } = response.data;
      if (accessToken && userData) {
        const normalizedUser = {
          ...userData,
          credits: userData.credits ?? 100,
        };
        setToken(accessToken);
        setUser(normalizedUser);
      }
      return message || 'Registration successful. Welcome!';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerUser, logout, setUser, updateUserCredits }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
