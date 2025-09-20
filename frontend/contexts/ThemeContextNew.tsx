import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tema simples e garantido
const simpleLightTheme = {
  colors: {
    primary: '#0B57D0',
    onPrimary: '#FFFFFF',
    secondary: '#035D5A',
    onSecondary: '#FFFFFF',
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    background: '#FEFBFF',
    onBackground: '#1C1B1F',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    onSurfaceVariant: '#49454F',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    warning: '#ED6C02',
    success: '#2E7D32',
    info: '#0288D1',
  },
  typography: {
    headlineLarge: { fontSize: 32, fontWeight: 'bold' },
    headlineMedium: { fontSize: 28, fontWeight: 'bold' },
    headlineSmall: { fontSize: 24, fontWeight: 'bold' },
    titleLarge: { fontSize: 22, fontWeight: '600' },
    titleMedium: { fontSize: 16, fontWeight: '600' },
    titleSmall: { fontSize: 14, fontWeight: '600' },
    bodyLarge: { fontSize: 16, fontWeight: 'normal' },
    bodyMedium: { fontSize: 14, fontWeight: 'normal' },
    bodySmall: { fontSize: 12, fontWeight: 'normal' },
    labelLarge: { fontSize: 14, fontWeight: '500' },
    labelMedium: { fontSize: 12, fontWeight: '500' },
    labelSmall: { fontSize: 11, fontWeight: '500' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  elevation: {
    level0: { elevation: 0, shadowOpacity: 0 },
    level1: { elevation: 1, shadowOpacity: 0.05 },
    level2: { elevation: 2, shadowOpacity: 0.08 },
    level3: { elevation: 4, shadowOpacity: 0.11 },
    level4: { elevation: 8, shadowOpacity: 0.14 },
    level5: { elevation: 12, shadowOpacity: 0.17 },
  },
  isDark: false,
};

interface ThemeContextType {
  theme: typeof simpleLightTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    console.error('❌ [THEME] useTheme deve ser usado dentro de um ThemeProvider');
    // Retornar tema padrão se não estiver em um provider
    return {
      theme: simpleLightTheme,
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sempre usar o tema simples por enquanto
  const theme = simpleLightTheme;

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log('✅ [THEME] ThemeProvider carregado com sucesso');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  const value = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  if (!isLoaded) {
    // Retornar tema padrão enquanto carrega
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  }

  console.log('🎨 [THEME] Fornecendo tema:', { 
    hasTheme: !!theme, 
    hasColors: !!theme?.colors, 
    hasTypography: !!theme?.typography,
    isDark 
  });

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

