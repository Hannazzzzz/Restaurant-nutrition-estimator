import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUsername, setUsername as saveUsername, clearUsername } from '../utils/userUtils';

interface AuthContextType {
  username: string | null;
  isLoggedIn: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [username, setUsernameState] = useState<string | null>(null);

  useEffect(() => {
    // Load username from localStorage on app start
    const savedUsername = getUsername();
    setUsernameState(savedUsername);
  }, []);

  const login = (newUsername: string) => {
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername) {
      saveUsername(trimmedUsername);
      setUsernameState(trimmedUsername);
    }
  };

  const logout = () => {
    clearUsername();
    setUsernameState(null);
  };

  const value: AuthContextType = {
    username,
    isLoggedIn: !!username,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}