import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { componentColors } from '../../design/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperStyle?: TextStyle;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  ...props
}, ref) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const [isFocused, setIsFocused] = useState(false);
  const colors = theme.isDark ? componentColors : componentColors;

  const getContainerStyle = (): ViewStyle => {
    return {
      marginBottom: theme.spacing.md,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      ...theme.typography.labelMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      minHeight: theme.touchTargets.comfortable,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: disabled ? colors.input.disabled.background : colors.input.background,
    };

    if (isFocused) {
      baseStyle.borderColor = colors.input.focus.border;
    } else if (error) {
      baseStyle.borderColor = colors.input.error.border;
    } else {
      baseStyle.borderColor = colors.input.border;
    }

    return baseStyle;
  };

  const getInputStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyMedium,
      flex: 1,
      color: disabled ? colors.input.disabled.text : colors.input.text,
      paddingVertical: theme.spacing.sm,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    };
  };

  const getHelperStyle = (): TextStyle => {
    return {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    };
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.input.placeholder}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[getErrorStyle(), errorStyle]}>
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text style={[getHelperStyle(), helperStyle]}>
          {helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
});

// Inputs específicos para facilitar o uso
export const SearchInput: React.FC<Omit<InputProps, 'leftIcon'>> = (props) => (
  <Input
    {...props}
    leftIcon={
      <Text style={{ color: '#666', fontSize: 16 }}>🔍</Text>
    }
  />
);

export const PasswordInput: React.FC<Omit<InputProps, 'rightIcon' | 'onRightIconPress'>> = (props) => {
  const [isSecure, setIsSecure] = React.useState(true);
  
  return (
    <Input
      {...props}
      secureTextEntry={isSecure}
      rightIcon={
        <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
          <Text style={{ color: '#666', fontSize: 16 }}>
            {isSecure ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      }
    />
  );
};
