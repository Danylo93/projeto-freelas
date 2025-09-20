/**
 * Design Tokens - Material 3 com customizações
 * Baseado no Material Design 3 com tokens personalizados para o app
 */

// Cores primárias
export const colors = {
  // Primary
  primary: '#0B57D0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D6E2FF',
  onPrimaryContainer: '#001A41',
  
  // Secondary
  secondary: '#035D5A',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#A7F0ED',
  onSecondaryContainer: '#00201E',
  
  // Tertiary
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  
  // Error
  error: '#D32F2F',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  
  // Success
  success: '#2E7D32',
  onSuccess: '#FFFFFF',
  successContainer: '#C8E6C9',
  onSuccessContainer: '#1B5E20',
  
  // Warning
  warning: '#ED6C02',
  onWarning: '#FFFFFF',
  warningContainer: '#FFE0B2',
  onWarningContainer: '#E65100',
  
  // Info
  info: '#0288D1',
  onInfo: '#FFFFFF',
  infoContainer: '#B3E5FC',
  onInfoContainer: '#01579B',
  
  // Surface
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#F4F6F8',
  onSurfaceVariant: '#44474E',
  surfaceContainer: '#F1F0F4',
  surfaceContainerHigh: '#EBE9ED',
  surfaceContainerHighest: '#E6E0E9',
  
  // Outline
  outline: '#74777F',
  outlineVariant: '#C4C7C5',
  
  // Background
  background: '#FEFBFF',
  onBackground: '#1A1C1E',
  
  // Inverse
  inverseSurface: '#2F3033',
  onInverseSurface: '#F1F0F4',
  inversePrimary: '#AAC7FF',
  
  // Scrim
  scrim: '#000000',
  
  // Shadow
  shadow: '#000000',
  
  // Surface tint
  surfaceTint: '#0B57D0',
} as const;

// Cores para Dark Mode
export const darkColors = {
  // Primary
  primary: '#AAC7FF',
  onPrimary: '#002F67',
  primaryContainer: '#004492',
  onPrimaryContainer: '#D6E2FF',
  
  // Secondary
  secondary: '#8BD3D0',
  onSecondary: '#003A38',
  secondaryContainer: '#00504E',
  onSecondaryContainer: '#A7F0ED',
  
  // Tertiary
  tertiary: '#F0B8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  
  // Error
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  
  // Success
  success: '#A5D6A7',
  onSuccess: '#003300',
  successContainer: '#004D00',
  onSuccessContainer: '#C8E6C9',
  
  // Warning
  warning: '#FFCC02',
  onWarning: '#4A3000',
  warningContainer: '#6D4300',
  onWarningContainer: '#FFE0B2',
  
  // Info
  info: '#81D4FA',
  onInfo: '#003C8F',
  infoContainer: '#01579B',
  onInfoContainer: '#B3E5FC',
  
  // Surface
  surface: '#121212',
  onSurface: '#E3E2E6',
  surfaceVariant: '#44474E',
  onSurfaceVariant: '#C4C7C5',
  surfaceContainer: '#1E1F22',
  surfaceContainerHigh: '#2A2D2F',
  surfaceContainerHighest: '#35373A',
  
  // Outline
  outline: '#8E9199',
  outlineVariant: '#44474E',
  
  // Background
  background: '#121212',
  onBackground: '#E3E2E6',
  
  // Inverse
  inverseSurface: '#E3E2E6',
  onInverseSurface: '#2F3033',
  inversePrimary: '#0B57D0',
  
  // Scrim
  scrim: '#000000',
  
  // Shadow
  shadow: '#000000',
  
  // Surface tint
  surfaceTint: '#AAC7FF',
} as const;

// Tipografia
export const typography = {
  // Display
  displayLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  
  // Headline
  headlineLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  
  // Title
  titleLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  titleSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
  
  // Label
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
} as const;

// Espaçamentos (baseado em grid de 4pt)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
} as const;

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  full: 9999,
} as const;

// Elevação (shadows)
export const elevation = {
  level0: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.11,
    shadowRadius: 2,
    elevation: 3,
  },
  level4: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
  },
  level5: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
} as const;

// Estados de interação (opacidades)
export const interactionStates = {
  hover: 0.08,
  pressed: 0.12,
  focus: 0.16,
  disabled: 0.38,
} as const;

// Tamanhos de toque (acessibilidade)
export const touchTargets = {
  minimum: 44,
  comfortable: 48,
  large: 56,
} as const;

// Breakpoints para responsividade
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Duração das animações
export const animation = {
  short: 150,
  medium: 220,
  long: 300,
  extraLong: 500,
} as const;

// Curvas de animação
export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

