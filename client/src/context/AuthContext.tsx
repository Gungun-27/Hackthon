import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin';
  is_phone_verified: boolean;
  is_email_verified: boolean;
  is_identity_verified: boolean;
  digilocker_doc_ref?: string;
  badge_number?: string;
  department_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<User>;
  quickLogin: (roleKey: 'citizen_verified' | 'citizen_unverified' | 'officer' | 'admin') => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tm_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('tm_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch {
          localStorage.removeItem('tm_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (identifier: string, pass: string): Promise<User> => {
    const res = await api.post('/auth/login', { identifier, password: pass });
    const { accessToken, user: loggedUser } = res.data;
    localStorage.setItem('tm_token', accessToken);
    setToken(accessToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const quickLogin = async (roleKey: 'citizen_verified' | 'citizen_unverified' | 'officer' | 'admin'): Promise<User> => {
    const credentialsMap = {
      citizen_verified: { identifier: 'rajesh.deshmukh@nagpur.in', pass: 'citizen123' },
      citizen_unverified: { identifier: 'pooja.kulkarni@gmail.com', pass: 'citizen123' },
      officer: { identifier: 'officer.patil@nagpurtrafficpolice.gov.in', pass: 'officer123' },
      admin: { identifier: 'command.control@nmc.gov.in', pass: 'admin123' }
    };

    const creds = credentialsMap[roleKey];
    return await login(creds.identifier, creds.pass);
  };

  const logout = () => {
    localStorage.removeItem('tm_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const updateUser = (u: User) => {
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLogin,
        logout,
        refreshUser,
        updateUser
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
