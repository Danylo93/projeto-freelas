import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { componentColors } from '../../design/theme';

export interface CardProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  content?: string;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  textStyle?: TextStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  content,
  variant = 'elevated',
  padding = 'medium',
  onPress,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  textStyle,
  ...props
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const colors = theme.isDark ? componentColors : componentColors;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      backgroundColor: colors.card.background,
    };

    // Variant
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...theme.elevation.level1,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.card.border,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceContainer,
        };
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'small':
        return { padding: theme.spacing.sm };
      case 'large':
        return { padding: theme.spacing.xl };
      default:
        return { padding: theme.spacing.lg };
    }
  };

  const getTitleStyle = (): TextStyle => {
    return {
      ...theme.typography.titleMedium,
      color: colors.card.text,
      marginBottom: subtitle || content ? theme.spacing.xs : 0,
    };
  };

  const getSubtitleStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: content ? theme.spacing.xs : 0,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyMedium,
      color: colors.card.text,
    };
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    return (
      <>
        {title && (
          <Text style={[getTitleStyle(), titleStyle]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[getSubtitleStyle(), subtitleStyle]}>
            {subtitle}
          </Text>
        )}
        {content && (
          <Text style={[getTextStyle(), textStyle]}>
            {content}
          </Text>
        )}
      </>
    );
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyle(), getPaddingStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      <View style={[styles.content, contentStyle]}>
        {renderContent()}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});

// Cards específicos para facilitar o uso
export const ElevatedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="elevated" />
);

export const OutlinedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="outlined" />
);

export const FilledCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="filled" />
);

// Card específico para prestadores
export interface ProviderCardProps extends Omit<CardProps, 'children'> {
  name: string;
  category: string;
  rating: number;
  distance: number;
  price: number;
  status: 'online' | 'busy' | 'offline';
  avatar?: string;
  onPress?: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  name,
  category,
  rating,
  distance,
  price,
  status,
  avatar,
  onPress,
  style,
  ...props
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const colors = theme.isDark ? componentColors : componentColors;

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return colors.status.online;
      case 'busy':
        return colors.status.busy;
      case 'offline':
        return colors.status.offline;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Disponível';
      case 'busy':
        return 'Ocupado';
      case 'offline':
        return 'Offline';
    }
  };

  return (
    <Card
      onPress={onPress}
      style={[styles.providerCard, style]}
      {...props}
    >
      <View style={styles.providerHeader}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Text style={styles.avatarText}>{avatar}</Text>
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={[styles.avatarText, { color: theme.colors.onPrimaryContainer }]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.providerInfo}>
          <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>
            {name}
          </Text>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>
            {category}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[theme.typography.labelSmall, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      
      <View style={styles.providerDetails}>
        <View style={styles.ratingContainer}>
          <Text style={[theme.typography.labelMedium, { color: theme.colors.onSurface }]}>
            ⭐ {rating.toFixed(1)}
          </Text>
        </View>
        
        <View style={styles.distanceContainer}>
          <Text style={[theme.typography.labelMedium, { color: theme.colors.onSurface }]}>
            📍 {distance.toFixed(1)} km
          </Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={[theme.typography.titleMedium, { color: theme.colors.primary }]}>
            R$ {price.toFixed(2)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const providerStyles = StyleSheet.create({
  providerCard: {
    marginBottom: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  providerInfo: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  providerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flex: 1,
  },
  distanceContainer: {
    flex: 1,
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
