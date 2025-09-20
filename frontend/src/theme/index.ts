/**
 * Sistema de Tema Unificado - Freelas
 * Integra design tokens com Material 3 e suporte a dark/light mode
 */

import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar tokens do design system
import { colors, darkColors, typography, spacing, borderRadius, elevation, interactionStates, touchTargets, animation, easing } from '../../design/tokens';

export interface AppTheme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  elevation: typeof elevation;
  interactionStates: typeof interactionStates;
  touchTargets: typeof touchTargets;
  animation: typeof animation;
  easing: typeof easing;
  isDark: boolean;
}

// Tema claro
export const lightTheme: AppTheme = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevation,
  interactionStates,
  touchTargets,
  animation,
  easing,
  isDark: false,
};

// Tema escuro
export const darkTheme: AppTheme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  elevation,
  interactionStates,
  touchTargets,
  animation,
  easing,
  isDark: true,
};

// Cores específicas para componentes
export const componentColors = {
  // Status colors
  online: '#4CAF50',
  offline: '#9E9E9E',
  busy: '#FF9800',
  away: '#FFC107',
  
  // Service types
  plumbing: '#2196F3',
  electrical: '#FF9800',
  cleaning: '#4CAF50',
  maintenance: '#9C27B0',
  other: '#607D8B',
  
  // Request status
  pending: '#FF9800',
  accepted: '#4CAF50',
  inProgress: '#2196F3',
  completed: '#4CAF50',
  cancelled: '#F44336',
};

// Adapter para NavigationContainer
export const getNavigationTheme = (theme: AppTheme) => ({
  dark: theme.isDark,
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.onBackground,
    border: theme.colors.outline,
    notification: theme.colors.primary,
  },
});

// Adapter para StatusBar
export const getStatusBarStyle = (theme: AppTheme) => 
  theme.isDark ? 'light-content' : 'dark-content';

// Adapter para StatusBar backgroundColor
export const getStatusBarBackgroundColor = (theme: AppTheme) => 
  theme.colors.surface;

// Hook para detectar mudanças do sistema
export const useSystemColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });
    
    return () => subscription?.remove();
  }, []);
  
  return colorScheme;
};

// Utilitários de tema
export const themeUtils = {
  // Verificar se cor é clara
  isLightColor: (color: string): boolean => {
    // Implementação simples - pode ser melhorada
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  },
  
  // Obter cor de contraste
  getContrastColor: (backgroundColor: string): string => {
    return themeUtils.isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
  },
  
  // Obter cor de status
  getStatusColor: (status: string): string => {
    return componentColors[status as keyof typeof componentColors] || componentColors.other;
  },
};

// Import necessário para useState e useEffect
import { useState, useEffect } from 'react';
