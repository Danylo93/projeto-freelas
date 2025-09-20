import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { componentColors } from '../../design/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tonal' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const colors = theme.isDark ? componentColors : componentColors;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      minHeight: theme.touchTargets.comfortable,
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = theme.spacing.md;
        baseStyle.paddingVertical = theme.spacing.sm;
        baseStyle.minHeight = theme.touchTargets.minimum;
        break;
      case 'large':
        baseStyle.paddingHorizontal = theme.spacing.xl;
        baseStyle.paddingVertical = theme.spacing.lg;
        baseStyle.minHeight = theme.touchTargets.large;
        break;
      default:
        baseStyle.paddingHorizontal = theme.spacing.lg;
        baseStyle.paddingVertical = theme.spacing.md;
    }

    // Variant
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = disabled ? colors.primaryButton.disabled.background : colors.primaryButton.background;
        baseStyle.borderColor = disabled ? colors.primaryButton.disabled.border : colors.primaryButton.border;
        break;
      case 'secondary':
        baseStyle.backgroundColor = disabled ? colors.secondaryButton.disabled.background : colors.secondaryButton.background;
        baseStyle.borderColor = disabled ? colors.secondaryButton.disabled.border : colors.secondaryButton.border;
        break;
      case 'tonal':
        baseStyle.backgroundColor = disabled ? colors.tonalButton.disabled.background : colors.tonalButton.background;
        baseStyle.borderColor = disabled ? colors.tonalButton.disabled.border : colors.tonalButton.border;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderColor = 'transparent';
        baseStyle.borderWidth = 0;
        break;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
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
        baseStyle.fontSize = theme.typography.labelMedium.fontSize;
        baseStyle.lineHeight = theme.typography.labelMedium.lineHeight;
        break;
      case 'large':
        baseStyle.fontSize = theme.typography.labelLarge.fontSize;
        baseStyle.lineHeight = theme.typography.labelLarge.lineHeight;
        break;
      default:
        baseStyle.fontSize = theme.typography.labelMedium.fontSize;
        baseStyle.lineHeight = theme.typography.labelMedium.lineHeight;
    }

    // Variant
    switch (variant) {
      case 'primary':
        baseStyle.color = disabled ? colors.primaryButton.disabled.text : colors.primaryButton.text;
        break;
      case 'secondary':
        baseStyle.color = disabled ? colors.secondaryButton.disabled.text : colors.secondaryButton.text;
        break;
      case 'tonal':
        baseStyle.color = disabled ? colors.tonalButton.disabled.text : colors.tonalButton.text;
        break;
      case 'text':
        baseStyle.color = disabled ? theme.colors.outline : theme.colors.primary;
        break;
    }

    return baseStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={getTextStyle().color}
            style={styles.loadingIndicator}
          />
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </View>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>{icon}</View>
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </View>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <View style={styles.contentContainer}>
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          <View style={styles.iconContainer}>{icon}</View>
        </View>
      );
    }

    return <Text style={[getTextStyle(), textStyle]}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

// Botões específicos para facilitar o uso
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const TonalButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="tonal" />
);

export const TextButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="text" />
);
