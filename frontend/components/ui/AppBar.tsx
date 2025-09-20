import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  StatusBar,
  Platform,
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
        break;
    }

    return baseStyle;
  };

  const getSubtitleStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    };
  };

  const getIconStyle = (): ViewStyle => {
    return {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    };
  };

  const renderLeftContent = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity
          style={[getIconStyle(), iconStyle]}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      );
    }

    if (leftIcon) {
      return (
        <TouchableOpacity
          style={[getIconStyle(), iconStyle]}
          onPress={onLeftIconPress}
          activeOpacity={0.7}
        >
          {leftIcon}
        </TouchableOpacity>
      );
    }

    return <View style={styles.placeholder} />;
  };

  const renderRightContent = () => {
    if (rightIcon) {
      return (
        <TouchableOpacity
          style={[getIconStyle(), iconStyle]}
          onPress={onRightIconPress}
          activeOpacity={0.7}
        >
          {rightIcon}
        </TouchableOpacity>
      );
    }

    return <View style={styles.placeholder} />;
  };

  const renderTitle = () => {
    if (!title) return null;

    return (
      <View style={styles.titleContainer}>
        <Text style={[getTitleStyle(), titleStyle]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[getSubtitleStyle(), subtitleStyle]}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
        translucent={Platform.OS === 'android'}
      />
      <View style={[getAppBarStyle(), style]}>
        <View style={styles.content}>
          {renderLeftContent()}
          {renderTitle()}
          {renderRightContent()}
        </View>
      </View>
    </>
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
    paddingHorizontal: theme.spacing.md,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});

// AppBar específico para telas principais
export interface MainAppBarProps extends Omit<AppBarProps, 'title' | 'rightIcon'> {
  user?: {
    name: string;
    avatar?: string;
  };
  notifications?: {
    count: number;
    onPress: () => void;
  };
  onProfilePress?: () => void;
}

export const MainAppBar: React.FC<MainAppBarProps> = ({
  user,
  notifications,
  onProfilePress,
  ...props
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;

  const renderProfileIcon = () => {
    if (user?.avatar) {
      return (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user.avatar}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
        <Text style={[styles.avatarText, { color: theme.colors.onPrimaryContainer }]}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
    );
  };

  const renderNotificationIcon = () => {
    if (!notifications) return null;

    return (
      <View style={styles.notificationContainer}>
        <Text style={styles.notificationIcon}>🔔</Text>
        {notifications.count > 0 && (
          <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={[styles.notificationCount, { color: theme.colors.onError }]}>
              {notifications.count > 99 ? '99+' : notifications.count}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <AppBar
      title={user?.name || 'Olá!'}
      subtitle="Como posso ajudar?"
      leftIcon={renderProfileIcon()}
      rightIcon={renderNotificationIcon()}
      onLeftIconPress={onProfilePress}
      onRightIconPress={notifications?.onPress}
      {...props}
    />
  );
};

const mainAppBarStyles = StyleSheet.create({
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationContainer: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '600',
  },
});
