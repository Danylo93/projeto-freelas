/**
 * ThemeProvider Unificado - Freelas
 * Gerencia tema claro/escuro com persistência e detecção automática do sistema
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, lightTheme, darkTheme, useSystemColorScheme } from '../theme';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  isSystemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Detectar tema do sistema
  const systemColorScheme = useSystemColorScheme();
  
  // Carregar preferências salvas
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        const savedSystemTheme = await AsyncStorage.getItem('use_system_theme');
        
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
        
        if (savedSystemTheme !== null) {
          setIsSystemTheme(savedSystemTheme === 'true');
        }
      } catch (error) {
        console.warn('Erro ao carregar preferências de tema:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadThemePreferences();
  }, []);
  
  // Aplicar tema baseado nas preferências
  useEffect(() => {
    if (isLoaded) {
      if (isSystemTheme) {
        setIsDark(systemColorScheme === 'dark');
      }
    }
  }, [isLoaded, isSystemTheme, systemColorScheme]);
  
  // Tema atual
  const theme = isDark ? darkTheme : lightTheme;
  
  // Toggle tema
  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    setIsSystemTheme(false);
    
    try {
      await AsyncStorage.setItem('theme_preference', newIsDark ? 'dark' : 'light');
      await AsyncStorage.setItem('use_system_theme', 'false');
    } catch (error) {
      console.warn('Erro ao salvar preferência de tema:', error);
    }
  };
  
  // Definir tema manualmente
  const setTheme = async (newIsDark: boolean) => {
    setIsDark(newIsDark);
    setIsSystemTheme(false);
    
    try {
      await AsyncStorage.setItem('theme_preference', newIsDark ? 'dark' : 'light');
      await AsyncStorage.setItem('use_system_theme', 'false');
    } catch (error) {
      console.warn('Erro ao salvar preferência de tema:', error);
    }
  };
  
  // Usar tema do sistema
  const setSystemTheme = async (useSystem: boolean) => {
    setIsSystemTheme(useSystem);
    
    if (useSystem) {
      setIsDark(systemColorScheme === 'dark');
    }
    
    try {
      await AsyncStorage.setItem('use_system_theme', useSystem.toString());
    } catch (error) {
      console.warn('Erro ao salvar preferência de tema do sistema:', error);
    }
  };
  
  // Log para debug
  useEffect(() => {
    if (isLoaded) {
      console.log('🎨 [THEME] ThemeProvider carregado com sucesso');
      console.log('🎨 [THEME] Fornecendo tema:', {
        hasColors: !!theme.colors,
        hasTheme: !!theme,
        hasTypography: !!theme.typography,
        isDark: theme.isDark,
        isSystemTheme,
        systemColorScheme,
      });
    }
  }, [isLoaded, theme, isSystemTheme, systemColorScheme]);
  
  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    isSystemTheme,
    setSystemTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
