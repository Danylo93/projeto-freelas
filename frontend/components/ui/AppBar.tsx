import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AppBarProps {
  title?: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  variant?: 'center-aligned' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  iconStyle?: ViewStyle;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  showBackButton = false,
  onBackPress,
  variant = 'center-aligned',
  style,
  titleStyle,
  subtitleStyle,
  iconStyle,
}) => {
  const insets = useSafeAreaInsets();

  const getAppBarStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: '#ffffff',
      paddingTop: insets.top,
      paddingHorizontal: 16,
      paddingBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    };

    switch (variant) {
      case 'small':
        baseStyle.paddingVertical = 8;
        break;
      case 'medium':
        baseStyle.paddingVertical = 16;
        break;
      case 'large':
        baseStyle.paddingVertical = 24;
        break;
    }

    return baseStyle;
  };

  const getTitleStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 20,
      fontWeight: '600',
      color: '#333333',
    };

    switch (variant) {
      case 'small':
        baseStyle.fontSize = 18;
        break;
      case 'medium':
        baseStyle.fontSize = 20;
        break;
      case 'large':
        baseStyle.fontSize = 24;
        break;
    }

    return baseStyle;
  };

  const renderLeftAction = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity onPress={onBackPress} style={[styles.iconButton, iconStyle]}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      );
    }

    if (leftIcon) {
      return (
        <TouchableOpacity onPress={onLeftIconPress} style={[styles.iconButton, iconStyle]}>
          {leftIcon}
        </TouchableOpacity>
      );
    }

    return <View style={styles.placeholder} />;
  };

  const renderRightAction = () => {
    if (rightIcon) {
      return (
        <TouchableOpacity onPress={onRightIconPress} style={[styles.iconButton, iconStyle]}>
          {rightIcon}
        </TouchableOpacity>
      );
    }

    return <View style={styles.placeholder} />;
  };

  return (
    <View style={[getAppBarStyle(), style]}>
      <View style={styles.content}>
        {renderLeftAction()}
        
        <View style={styles.titleContainer}>
          {title && (
            <Text style={[getTitleStyle(), titleStyle]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>
              {subtitle}
            </Text>
          )}
        </View>

        {renderRightAction()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#667eea',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});

export default AppBar;
