import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SectionPermissions, StoreSettings } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: SectionPermissions | null;
  settings: StoreSettings | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasAccess: (sectionKey: keyof SectionPermissions | 'developer') => boolean;
  setLocalPermissions: (perms: SectionPermissions) => void;
  setLocalSettings: (st: StoreSettings) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('arwa_token'));
  const [permissions, setPermissions] = useState<SectionPermissions | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = async () => {
    const storedToken = localStorage.getItem('arwa_token');
    if (!storedToken) {
      setUser(null);
      setPermissions(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setPermissions(data.permissions);
      setSettings(data.settings);
    } catch (err) {
      console.warn('Session verification failed, clearing auth:', err);
      localStorage.removeItem('arwa_token');
      setUser(null);
      setToken(null);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const data = await api.login(credentials);
    localStorage.setItem('arwa_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setPermissions(data.permissions);

    // Also fetch full settings
    try {
      const full = await api.getMe();
      setSettings(full.settings);
    } catch {}
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem('arwa_token');
    setToken(null);
    setUser(null);
    setPermissions(null);
  };

  const hasAccess = (sectionKey: keyof SectionPermissions | 'developer'): boolean => {
    if (!user) return false;
    if (user.role === 'developer') return true;
    if (sectionKey === 'developer') return false; // developer panel only for developer role!
    if (!permissions) return false;
    return !!permissions[sectionKey as keyof SectionPermissions];
  };

  const setLocalPermissions = (perms: SectionPermissions) => {
    setPermissions(perms);
  };

  const setLocalSettings = (st: StoreSettings) => {
    setSettings(st);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        settings,
        isLoading,
        login,
        logout,
        refreshAuth,
        hasAccess,
        setLocalPermissions,
        setLocalSettings,
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
