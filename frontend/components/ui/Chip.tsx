import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { componentColors } from '../../design/theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  icon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  variant?: 'assist' | 'filter' | 'input' | 'suggestion';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  disabled = false,
  onPress,
  onClose,
  icon,
  closeIcon,
  variant = 'assist',
  size = 'medium',
  style,
  textStyle,
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const colors = theme.isDark ? componentColors : componentColors;

  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = theme.spacing.sm;
        baseStyle.paddingVertical = theme.spacing.xs;
        baseStyle.minHeight = 24;
        break;
      case 'large':
        baseStyle.paddingHorizontal = theme.spacing.lg;
        baseStyle.paddingVertical = theme.spacing.md;
        baseStyle.minHeight = 40;
        break;
      default:
        baseStyle.paddingHorizontal = theme.spacing.md;
        baseStyle.paddingVertical = theme.spacing.sm;
        baseStyle.minHeight = 32;
    }

    // Variant
    switch (variant) {
      case 'assist':
        if (selected) {
          baseStyle.backgroundColor = colors.chip.selected.background;
          baseStyle.borderColor = colors.chip.selected.background;
        } else {
          baseStyle.backgroundColor = colors.chip.background;
          baseStyle.borderColor = colors.chip.background;
        }
        break;
      case 'filter':
        if (selected) {
          baseStyle.backgroundColor = colors.chip.selected.background;
          baseStyle.borderColor = colors.chip.selected.background;
        } else {
          baseStyle.backgroundColor = 'transparent';
          baseStyle.borderColor = colors.chip.background;
        }
        break;
      case 'input':
        baseStyle.backgroundColor = colors.chip.background;
        baseStyle.borderColor = colors.chip.background;
        break;
      case 'suggestion':
        baseStyle.backgroundColor = colors.chip.background;
        baseStyle.borderColor = colors.chip.background;
        break;
    }

    // Disabled
    if (disabled) {
      baseStyle.backgroundColor = colors.chip.disabled.background;
      baseStyle.borderColor = colors.chip.disabled.background;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '500',
      textAlign: 'center',
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.fontSize = theme.typography.labelSmall.fontSize;
        baseStyle.lineHeight = theme.typography.labelSmall.lineHeight;
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
      case 'assist':
        if (selected) {
          baseStyle.color = colors.chip.selected.text;
        } else {
          baseStyle.color = colors.chip.text;
        }
        break;
      case 'filter':
        if (selected) {
          baseStyle.color = colors.chip.selected.text;
        } else {
          baseStyle.color = colors.chip.text;
        }
        break;
      case 'input':
        baseStyle.color = colors.chip.text;
        break;
      case 'suggestion':
        baseStyle.color = colors.chip.text;
        break;
    }

    // Disabled
    if (disabled) {
      baseStyle.color = colors.chip.disabled.text;
    }

    return baseStyle;
  };

  const renderContent = () => {
    return (
      <View style={styles.contentContainer}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        
        <Text style={[getTextStyle(), textStyle]}>
          {label}
        </Text>
        
        {closeIcon && onClose && (
          <TouchableOpacity
            style={styles.closeContainer}
            onPress={onClose}
            disabled={disabled}
          >
            {closeIcon}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getChipStyle(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getChipStyle(), style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 4,
  },
  closeContainer: {
    marginLeft: 4,
    padding: 2,
  },
});

// Chips específicos para facilitar o uso
export const FilterChip: React.FC<Omit<ChipProps, 'variant'>> = (props) => (
  <Chip {...props} variant="filter" />
);

export const AssistChip: React.FC<Omit<ChipProps, 'variant'>> = (props) => (
  <Chip {...props} variant="assist" />
);

export const InputChip: React.FC<Omit<ChipProps, 'variant'>> = (props) => (
  <Chip {...props} variant="input" />
);

export const SuggestionChip: React.FC<Omit<ChipProps, 'variant'>> = (props) => (
  <Chip {...props} variant="suggestion" />
);

// Chip específico para categorias de serviço
export interface CategoryChipProps extends Omit<ChipProps, 'label' | 'icon'> {
  category: {
    id: string;
    name: string;
    icon: string;
  };
  onSelect?: (categoryId: string) => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  onSelect,
  selected,
  ...props
}) => {
  const handlePress = () => {
    onSelect?.(category.id);
  };

  return (
    <Chip
      label={category.name}
      selected={selected}
      onPress={handlePress}
      icon={<Text style={{ fontSize: 16 }}>{category.icon}</Text>}
      {...props}
    />
  );
};
