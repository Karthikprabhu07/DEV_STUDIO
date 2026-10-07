import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCaptain: boolean;
  isDevMate: boolean;
  login: (email: string, pass?: string) => { success: boolean; error?: string };
  quickLogin: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Admin or saved session so user can immediately experience the platform
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUserId = localStorage.getItem('devstudio_active_user_id');
    if (savedUserId) {
      const match = INITIAL_USERS.find((u) => u.id === savedUserId);
      if (match) return match;
    }
    // Default to Admin for full immediate showcase, or Dev Mate if preferred
    return INITIAL_USERS[0]; // Admin by default
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('devstudio_active_user_id', currentUser.id);
    } else {
      localStorage.removeItem('devstudio_active_user_id');
    }
  }, [currentUser]);

  const login = (email: string, _pass?: string): { success: boolean; error?: string } => {
    const normalized = email.trim().toLowerCase();
    const user = INITIAL_USERS.find((u) => u.email.toLowerCase() === normalized);
    if (user) {
      setCurrentUser(user);
      return { success: true };
    }
    return { success: false, error: 'Invalid DevStudio credentials. Try demo quick login buttons.' };
  };

  const quickLogin = (role: UserRole) => {
    if (role === 'ADMIN') {
      const admin = INITIAL_USERS.find((u) => u.role === 'ADMIN') || INITIAL_USERS[0];
      setCurrentUser(admin);
    } else if (role === 'CAPTAIN') {
      const capt = INITIAL_USERS.find((u) => u.role === 'CAPTAIN') || INITIAL_USERS[1];
      setCurrentUser(capt);
    } else {
      const mate = INITIAL_USERS.find((u) => u.role === 'DEV_MATE') || INITIAL_USERS[3];
      setCurrentUser(mate);
    }
  };

  const switchUser = (userId: string) => {
    const found = INITIAL_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const role = currentUser ? currentUser.role : null;
  const isAuthenticated = currentUser !== null;
  const isAdmin = role === 'ADMIN';
  const isCaptain = role === 'CAPTAIN';
  const isDevMate = role === 'DEV_MATE';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isAdmin,
        isCaptain,
        isDevMate,
        login,
        quickLogin,
        switchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
