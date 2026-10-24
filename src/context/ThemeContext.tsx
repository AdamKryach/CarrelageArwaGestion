import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeSettings } from '../types';
import { api } from '../services/api';

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (newTheme: Partial<ThemeSettings>) => Promise<void>;
  previewTheme: (newTheme: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#b45309',
  secondaryColor: '#0f172a',
  accentColor: '#d97706',
  sidebarBg: '#1e293b',
  sidebarText: '#f8fafc',
  headerBg: '#ffffff',
  fontFamily: 'Plus Jakarta Sans',
  borderRadius: 'rounded-lg',
  interfaceDensity: 'comfortable',
  isDarkMode: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

  useEffect(() => {
    api.getTheme()
      .then((t) => {
        if (t && t.primaryColor) {
          setTheme(t);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Apply primary color to CSS custom property
    document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--color-accent', theme.accentColor);
    document.body.style.fontFamily = `"${theme.fontFamily}", sans-serif`;

    if (theme.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateTheme = async (newTheme: Partial<ThemeSettings>) => {
    const updated = { ...theme, ...newTheme };
    setTheme(updated);
    await api.updateTheme(newTheme);
  };

  const previewTheme = (newTheme: Partial<ThemeSettings>) => {
    setTheme((prev) => ({ ...prev, ...newTheme }));
  };

  const resetTheme = () => {
    updateTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, previewTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
