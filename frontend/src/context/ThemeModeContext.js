import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from '../utils/theme';

const ThemeModeContext = createContext(null);

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return context;
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  const value = useMemo(() => ({
    mode,
    isDarkMode: mode === 'dark',
    theme: mode === 'dark' ? darkTheme : lightTheme,
    toggleThemeMode: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
    setThemeMode: setMode,
  }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};
