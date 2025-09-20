import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, AppTheme } from '../design/theme';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sempre usar lightTheme por enquanto para garantir que funcione
  const theme = lightTheme;
  
  console.log('🎨 [THEME] ThemeProvider renderizando com tema:', theme ? 'válido' : 'inválido');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveThemePreference();
    }
  }, [isDark, isLoaded]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        // Use system preference as default
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system preference
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
    } finally {
      setIsLoaded(true);
    }
  };

  const saveThemePreference = async () => {
    try {
      await AsyncStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if user hasn't set a preference
      AsyncStorage.getItem('theme_preference').then((savedTheme) => {
        if (savedTheme === null) {
          setIsDark(colorScheme === 'dark');
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  const value = {
    theme,
    isDark: false,
    toggleTheme: () => {},
    setTheme: () => {},
  };

  console.log('🎨 [THEME] Fornecendo tema:', { 
    hasTheme: !!theme, 
    hasColors: !!theme?.colors, 
    hasTypography: !!theme?.typography 
  });

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
