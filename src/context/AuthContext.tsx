import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { UserLogin, UserCreate, Token } from '@/models/api_models';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (credentials: UserLogin) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      try {
        const decodedToken: { sub: string; exp: number } = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) { // Check if token is not expired
          setIsAuthenticated(true);
          setUserEmail(decodedToken.sub);
        } else {
          authService.logout(); // Token expired
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        authService.logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: UserLogin) => {
    setLoading(true);
    try {
      const token = await authService.loginUser(credentials);
      const decodedToken: { sub: string; exp: number } = jwtDecode(token.access_token);
      setIsAuthenticated(true);
      setUserEmail(decodedToken.sub);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const token = await authService.googleLogin(idToken);
      const decodedToken: { sub: string; exp: number } = jwtDecode(token.access_token);
      setIsAuthenticated(true);
      setUserEmail(decodedToken.sub);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserCreate) => {
    setLoading(true);
    try {
      await authService.registerUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, googleLogin, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
