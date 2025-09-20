import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
  badge?: number;
}

export interface BottomTabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  labelStyle?: TextStyle;
  iconStyle?: TextStyle;
}

export const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabPress,
  style,
  tabStyle,
  labelStyle,
  iconStyle,
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const insets = useSafeAreaInsets();

  const getContainerStyle = (): ViewStyle => {
    return {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingBottom: insets.bottom,
      paddingTop: theme.spacing.sm,
      ...theme.elevation.level1,
    };
  };

  const getTabStyle = (isActive: boolean): ViewStyle => {
    return {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      minHeight: theme.touchTargets.comfortable,
    };
  };

  const getLabelStyle = (isActive: boolean): TextStyle => {
    return {
      ...theme.typography.labelSmall,
      color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    };
  };

  const getIconStyle = (isActive: boolean): TextStyle => {
    return {
      fontSize: 20,
      color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant,
    };
  };

  const getBadgeStyle = (): ViewStyle => {
    return {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const getBadgeTextStyle = (): TextStyle => {
    return {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onError,
    };
  };

  return (
    <View style={[getContainerStyle(), style]}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const displayIcon = isActive && tab.activeIcon ? tab.activeIcon : tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[getTabStyle(isActive), tabStyle]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Text style={[getIconStyle(isActive), iconStyle]}>
                  {displayIcon}
                </Text>
                {tab.badge && tab.badge > 0 && (
                  <View style={getBadgeStyle()}>
                    <Text style={getBadgeTextStyle()}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[getLabelStyle(isActive), labelStyle]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// BottomTabNavigation específico para o app
export interface AppBottomTabNavigationProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
  notificationsCount?: number;
  style?: ViewStyle;
}

export const AppBottomTabNavigation: React.FC<AppBottomTabNavigationProps> = ({
  activeTab,
  onTabPress,
  notificationsCount = 0,
  style,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: '🏠',
      activeIcon: '🏡',
    },
    {
      id: 'services',
      label: 'Serviços',
      icon: '🔧',
      activeIcon: '⚙️',
    },
    {
      id: 'activity',
      label: 'Atividade',
      icon: '📋',
      activeIcon: '📝',
      badge: notificationsCount,
    },
    {
      id: 'profile',
      label: 'Conta',
      icon: '👤',
      activeIcon: '👤',
    },
  ];

  return (
    <BottomTabNavigation
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={onTabPress}
      style={style}
    />
  );
};

// BottomTabNavigation específico para prestadores
export interface ProviderBottomTabNavigationProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
  requestsCount?: number;
  style?: ViewStyle;
}

export const ProviderBottomTabNavigation: React.FC<ProviderBottomTabNavigationProps> = ({
  activeTab,
  onTabPress,
  requestsCount = 0,
  style,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: '🏠',
      activeIcon: '🏡',
    },
    {
      id: 'requests',
      label: 'Solicitações',
      icon: '📋',
      activeIcon: '📝',
      badge: requestsCount,
    },
    {
      id: 'earnings',
      label: 'Ganhos',
      icon: '💰',
      activeIcon: '💵',
    },
    {
      id: 'profile',
      label: 'Conta',
      icon: '👤',
      activeIcon: '👤',
    },
  ];

  return (
    <BottomTabNavigation
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={onTabPress}
      style={style}
    />
  );
};
