import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { BlurView } from 'expo-blur';

export interface MapOverlayProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  distance?: number;
  eta?: number;
  price?: number;
  onPress?: () => void;
  variant?: 'minimal' | 'compact' | 'expanded';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export const MapOverlay: React.FC<MapOverlayProps> = ({
  children,
  title,
  subtitle,
  distance,
  eta,
  price,
  onPress,
  variant = 'compact',
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;

  const getOverlayStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      ...theme.elevation.level2,
    };

    // Variant
    switch (variant) {
      case 'minimal':
        baseStyle.padding = theme.spacing.sm;
        baseStyle.margin = theme.spacing.sm;
        break;
      case 'compact':
        baseStyle.padding = theme.spacing.md;
        baseStyle.margin = theme.spacing.md;
        break;
      case 'expanded':
        baseStyle.padding = theme.spacing.lg;
        baseStyle.margin = theme.spacing.lg;
        break;
    }

    return baseStyle;
  };

  const getTitleStyle = (): TextStyle => {
    return {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: subtitle ? theme.spacing.xs : 0,
    };
  };

  const getSubtitleStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: (distance || eta || price) ? theme.spacing.sm : 0,
    };
  };

  const getPillStyle = (): ViewStyle => {
    return {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    };
  };

  const getPillTextStyle = (): TextStyle => {
    return {
      ...theme.typography.labelSmall,
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    };
  };

  const renderPills = () => {
    if (!distance && !eta && !price) return null;

    return (
      <View style={styles.pillsContainer}>
        {distance && (
          <View style={getPillStyle()}>
            <Text style={getPillTextStyle()}>
              📍 {distance.toFixed(1)} km
            </Text>
          </View>
        )}
        {eta && (
          <View style={getPillStyle()}>
            <Text style={getPillTextStyle()}>
              ⏱️ {eta} min
            </Text>
          </View>
        )}
        {price && (
          <View style={getPillStyle()}>
            <Text style={getPillTextStyle()}>
              💰 R$ {price.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    );
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
        {renderPills()}
      </>
    );
  };

  const OverlayComponent = onPress ? TouchableOpacity : View;

  return (
    <OverlayComponent
      style={[getOverlayStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.content, contentStyle]}>
        {renderContent()}
      </View>
    </OverlayComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});

// MapOverlay específico para solicitação de serviço
export interface ServiceRequestOverlayProps extends Omit<MapOverlayProps, 'children'> {
  category: string;
  description: string;
  address: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ServiceRequestOverlay: React.FC<ServiceRequestOverlayProps> = ({
  category,
  description,
  address,
  onConfirm,
  onCancel,
  loading = false,
  ...props
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;

  return (
    <MapOverlay
      title="Solicitar Serviço"
      subtitle={`${category} - ${address}`}
      {...props}
    >
      <View style={styles.serviceRequestContent}>
        <View style={styles.serviceInfo}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
            {description}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[theme.typography.labelMedium, { color: theme.colors.onSurface }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            onPress={onConfirm}
            disabled={loading}
          >
            <Text style={[theme.typography.labelMedium, { color: theme.colors.onPrimary }]}>
              {loading ? 'Enviando...' : 'Confirmar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </MapOverlay>
  );
};

const serviceRequestStyles = StyleSheet.create({
  serviceRequestContent: {
    gap: 16,
  },
  serviceInfo: {
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// MapOverlay específico para prestador
export interface ProviderOverlayProps extends Omit<MapOverlayProps, 'children'> {
  provider: {
    name: string;
    rating: number;
    status: 'online' | 'busy' | 'offline';
  };
  onAccept: () => void;
  onDecline: () => void;
  loading?: boolean;
}

export const ProviderOverlay: React.FC<ProviderOverlayProps> = ({
  provider,
  onAccept,
  onDecline,
  loading = false,
  ...props
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;

  const getStatusColor = () => {
    switch (provider.status) {
      case 'online':
        return theme.colors.success;
      case 'busy':
        return theme.colors.warning;
      case 'offline':
        return theme.colors.outline;
    }
  };

  const getStatusText = () => {
    switch (provider.status) {
      case 'online':
        return 'Disponível';
      case 'busy':
        return 'Ocupado';
      case 'offline':
        return 'Offline';
    }
  };

  return (
    <MapOverlay
      title={provider.name}
      subtitle={`⭐ ${provider.rating.toFixed(1)} • ${getStatusText()}`}
      {...props}
    >
      <View style={styles.providerContent}>
        <View style={styles.providerInfo}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
            Status: {getStatusText()}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: theme.colors.outline }]}
            onPress={onDecline}
            disabled={loading}
          >
            <Text style={[theme.typography.labelMedium, { color: theme.colors.onSurface }]}>
              Recusar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: theme.colors.primary }]}
            onPress={onAccept}
            disabled={loading}
          >
            <Text style={[theme.typography.labelMedium, { color: theme.colors.onPrimary }]}>
              {loading ? 'Processando...' : 'Aceitar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </MapOverlay>
  );
};

const providerStyles = StyleSheet.create({
  providerContent: {
    gap: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
