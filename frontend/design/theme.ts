import { colors, darkColors, typography, spacing, borderRadius, elevation, interactionStates, touchTargets, animation, easing } from './tokens';

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

// Hook para usar o tema - REMOVIDO (usar o do ThemeContext)
// export const useTheme = () => {
//   // Em uma implementação real, isso viria de um contexto
//   // Por enquanto, retornamos o tema claro
//   return lightTheme;
// };

// Cores específicas para componentes
export const componentColors = {
  // Botões
  primaryButton: {
    background: colors.primary,
    text: colors.onPrimary,
    border: colors.primary,
    disabled: {
      background: colors.outline,
      text: colors.onSurface,
      border: colors.outline,
    },
  },
  secondaryButton: {
    background: 'transparent',
    text: colors.primary,
    border: colors.outline,
    disabled: {
      background: 'transparent',
      text: colors.outline,
      border: colors.outline,
    },
  },
  tonalButton: {
    background: colors.primaryContainer,
    text: colors.onPrimaryContainer,
    border: 'transparent',
    disabled: {
      background: colors.surfaceContainer,
      text: colors.onSurface,
      border: 'transparent',
    },
  },
  
  // Inputs
  input: {
    background: colors.surface,
    text: colors.onSurface,
    placeholder: colors.onSurfaceVariant,
    border: colors.outline,
    focus: {
      border: colors.primary,
    },
    error: {
      border: colors.error,
    },
    disabled: {
      background: colors.surfaceContainer,
      text: colors.onSurface,
      border: colors.outline,
    },
  },
  
  // Cards
  card: {
    background: colors.surface,
    text: colors.onSurface,
    border: colors.outlineVariant,
    elevated: {
      background: colors.surface,
      shadow: elevation.level1,
    },
  },
  
  // Chips
  chip: {
    background: colors.surfaceContainer,
    text: colors.onSurface,
    selected: {
      background: colors.primaryContainer,
      text: colors.onPrimaryContainer,
    },
    disabled: {
      background: colors.surfaceContainer,
      text: colors.outline,
    },
  },
  
  // Badges
  badge: {
    success: {
      background: colors.successContainer,
      text: colors.onSuccessContainer,
    },
    warning: {
      background: colors.warningContainer,
      text: colors.onWarningContainer,
    },
    error: {
      background: colors.errorContainer,
      text: colors.onErrorContainer,
    },
    info: {
      background: colors.infoContainer,
      text: colors.onInfoContainer,
    },
  },
  
  // Status
  status: {
    online: colors.success,
    busy: colors.warning,
    offline: colors.outline,
    available: colors.info,
  },
} as const;

// Cores para Dark Mode
export const darkComponentColors = {
  // Botões
  primaryButton: {
    background: darkColors.primary,
    text: darkColors.onPrimary,
    border: darkColors.primary,
    disabled: {
      background: darkColors.outline,
      text: darkColors.onSurface,
      border: darkColors.outline,
    },
  },
  secondaryButton: {
    background: 'transparent',
    text: darkColors.primary,
    border: darkColors.outline,
    disabled: {
      background: 'transparent',
      text: darkColors.outline,
      border: darkColors.outline,
    },
  },
  tonalButton: {
    background: darkColors.primaryContainer,
    text: darkColors.onPrimaryContainer,
    border: 'transparent',
    disabled: {
      background: darkColors.surfaceContainer,
      text: darkColors.onSurface,
      border: 'transparent',
    },
  },
  
  // Inputs
  input: {
    background: darkColors.surface,
    text: darkColors.onSurface,
    placeholder: darkColors.onSurfaceVariant,
    border: darkColors.outline,
    focus: {
      border: darkColors.primary,
    },
    error: {
      border: darkColors.error,
    },
    disabled: {
      background: darkColors.surfaceContainer,
      text: darkColors.onSurface,
      border: darkColors.outline,
    },
  },
  
  // Cards
  card: {
    background: darkColors.surface,
    text: darkColors.onSurface,
    border: darkColors.outlineVariant,
    elevated: {
      background: darkColors.surface,
      shadow: elevation.level1,
    },
  },
  
  // Chips
  chip: {
    background: darkColors.surfaceContainer,
    text: darkColors.onSurface,
    selected: {
      background: darkColors.primaryContainer,
      text: darkColors.onPrimaryContainer,
    },
    disabled: {
      background: darkColors.surfaceContainer,
      text: darkColors.outline,
    },
  },
  
  // Badges
  badge: {
    success: {
      background: darkColors.successContainer,
      text: darkColors.onSuccessContainer,
    },
    warning: {
      background: darkColors.warningContainer,
      text: darkColors.onWarningContainer,
    },
    error: {
      background: darkColors.errorContainer,
      text: darkColors.onErrorContainer,
    },
    info: {
      background: darkColors.infoContainer,
      text: darkColors.onInfoContainer,
    },
  },
  
  // Status
  status: {
    online: darkColors.success,
    busy: darkColors.warning,
    offline: darkColors.outline,
    available: darkColors.info,
  },
} as const;
