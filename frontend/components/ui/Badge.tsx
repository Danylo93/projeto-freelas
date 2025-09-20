import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { componentColors } from '../../design/theme';

export interface BadgeProps {
  children?: React.ReactNode;
  text?: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  max?: number;
  count?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  text,
  variant = 'neutral',
  size = 'medium',
  dot = false,
  max = 99,
  count,
  style,
  textStyle,
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const colors = theme.isDark ? componentColors : componentColors;

  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 16,
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = theme.spacing.xs;
        baseStyle.paddingVertical = 2;
        baseStyle.minHeight = 16;
        break;
      case 'large':
        baseStyle.paddingHorizontal = theme.spacing.sm;
        baseStyle.paddingVertical = theme.spacing.xs;
        baseStyle.minHeight = 24;
        break;
      default:
        baseStyle.paddingHorizontal = theme.spacing.sm;
        baseStyle.paddingVertical = 4;
        baseStyle.minHeight = 20;
    }

    // Variant
    switch (variant) {
      case 'success':
        baseStyle.backgroundColor = colors.badge.success.background;
        break;
      case 'warning':
        baseStyle.backgroundColor = colors.badge.warning.background;
        break;
      case 'error':
        baseStyle.backgroundColor = colors.badge.error.background;
        break;
      case 'info':
        baseStyle.backgroundColor = colors.badge.info.background;
        break;
      case 'neutral':
        baseStyle.backgroundColor = theme.colors.surfaceContainer;
        break;
    }

    // Dot variant
    if (dot) {
      baseStyle.width = 8;
      baseStyle.height = 8;
      baseStyle.minWidth = 8;
      baseStyle.minHeight = 8;
      baseStyle.paddingHorizontal = 0;
      baseStyle.paddingVertical = 0;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.fontSize = 10;
        baseStyle.lineHeight = 12;
        break;
      case 'large':
        baseStyle.fontSize = 12;
        baseStyle.lineHeight = 16;
        break;
      default:
        baseStyle.fontSize = 11;
        baseStyle.lineHeight = 14;
    }

    // Variant
    switch (variant) {
      case 'success':
        baseStyle.color = colors.badge.success.text;
        break;
      case 'warning':
        baseStyle.color = colors.badge.warning.text;
        break;
      case 'error':
        baseStyle.color = colors.badge.error.text;
        break;
      case 'info':
        baseStyle.color = colors.badge.info.text;
        break;
      case 'neutral':
        baseStyle.color = theme.colors.onSurface;
        break;
    }

    return baseStyle;
  };

  const getDisplayText = (): string => {
    if (text) return text;
    if (count !== undefined) {
      return count > max ? `${max}+` : count.toString();
    }
    return '';
  };

  const renderContent = () => {
    if (dot) {
      return null;
    }

    const displayText = getDisplayText();
    if (!displayText) return null;

    return (
      <Text style={[getTextStyle(), textStyle]}>
        {displayText}
      </Text>
    );
  };

  if (children) {
    return (
      <View style={styles.container}>
        {children}
        <View style={[getBadgeStyle(), styles.badge, style]}>
          {renderContent()}
        </View>
      </View>
    );
  }

  return (
    <View style={[getBadgeStyle(), style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});

// Badges específicos para facilitar o uso
export const SuccessBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="success" />
);

export const WarningBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="warning" />
);

export const ErrorBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="error" />
);

export const InfoBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="info" />
);

export const NeutralBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="neutral" />
);

// Badge específico para status de prestador
export interface StatusBadgeProps extends Omit<BadgeProps, 'text' | 'variant'> {
  status: 'online' | 'busy' | 'offline' | 'available';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  ...props
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return { text: 'Online', variant: 'success' as const };
      case 'busy':
        return { text: 'Ocupado', variant: 'warning' as const };
      case 'offline':
        return { text: 'Offline', variant: 'neutral' as const };
      case 'available':
        return { text: 'Disponível', variant: 'info' as const };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      text={config.text}
      variant={config.variant}
      {...props}
    />
  );
};

// Badge específico para notificações
export interface NotificationBadgeProps extends Omit<BadgeProps, 'text' | 'variant'> {
  count: number;
  max?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  ...props
}) => {
  if (count === 0) return null;

  return (
    <Badge
      count={count}
      max={max}
      variant="error"
      {...props}
    />
  );
};
