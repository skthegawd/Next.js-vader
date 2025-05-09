import React, { createContext, useContext, ReactNode } from 'react';

export const ThemeContext = createContext<'light' | 'dark'>('light');

interface ThemeProviderProps {
  theme: 'light' | 'dark';
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 