import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { distanceService, DistanceInfo } from '../../services/distanceService';

interface TripInfoCardProps {
  clientLocation: {
    latitude: number;
    longitude: number;
  };
  providerLocation?: {
    latitude: number;
    longitude: number;
  };
  status: 'searching' | 'matched' | 'enRoute' | 'arrived' | 'inProgress' | 'completed';
  providerName?: string;
  estimatedArrival?: string;
  category?: string;
  price?: number;
}

export const TripInfoCard: React.FC<TripInfoCardProps> = ({
  clientLocation,
  providerLocation,
  status,
  providerName,
  estimatedArrival,
  category,
  price,
}) => {
  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (clientLocation && providerLocation) {
      const info = distanceService.calculateDistanceInfo(clientLocation, providerLocation);
      setDistanceInfo(info);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [
    clientLocation?.latitude,
    clientLocation?.longitude,
    providerLocation?.latitude,
    providerLocation?.longitude,
    fadeAnim
  ]);

  const getStatusInfo = () => {
    switch (status) {
      case 'searching':
        return {
          icon: 'search',
          title: 'Procurando prestador...',
          subtitle: 'Aguarde enquanto encontramos o melhor profissional',
          color: '#FF9500',
        };
      case 'matched':
        return {
          icon: 'checkmark-circle',
          title: 'Prestador encontrado!',
          subtitle: `${providerName} aceitou sua solicitação`,
          color: '#34C759',
        };
      case 'enRoute':
        return {
          icon: 'car',
          title: 'A caminho',
          subtitle: `${providerName} está indo até você`,
          color: '#007AFF',
        };
      case 'arrived':
        return {
          icon: 'location',
          title: 'Chegou!',
          subtitle: `${providerName} chegou no local`,
          color: '#34C759',
        };
      case 'inProgress':
        return {
          icon: 'construct',
          title: 'Serviço em andamento',
          subtitle: `${providerName} está realizando o serviço`,
          color: '#FF9500',
        };
      case 'completed':
        return {
          icon: 'checkmark-circle',
          title: 'Serviço concluído!',
          subtitle: 'Como foi sua experiência?',
          color: '#34C759',
        };
      default:
        return {
          icon: 'time',
          title: 'Aguardando...',
          subtitle: 'Processando solicitação',
          color: '#8E8E93',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const renderDistanceInfo = () => {
    if (!distanceInfo || !providerLocation || status === 'completed') return null;

    return (
      <Animated.View style={[styles.distanceContainer, { opacity: fadeAnim }]}>
        <View style={styles.distanceItem}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.distanceText}>{distanceInfo.formattedDistance}</Text>
        </View>
        
        <View style={styles.distanceDivider} />
        
        <View style={styles.distanceItem}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.distanceText}>
            {estimatedArrival || distanceInfo.formattedDuration}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderServiceInfo = () => {
    if (!category && !price) return null;

    return (
      <View style={styles.serviceInfo}>
        {category && (
          <View style={styles.serviceItem}>
            <Ionicons name="construct-outline" size={16} color="#8E8E93" />
            <Text style={styles.serviceText}>{category}</Text>
          </View>
        )}
        
        {price && (
          <View style={styles.serviceItem}>
            <Ionicons name="card-outline" size={16} color="#8E8E93" />
            <Text style={styles.serviceText}>R$ {price.toFixed(2)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon as any} size={20} color="#FFFFFF" />
        </View>
        
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
        </View>
      </View>

      {renderDistanceInfo()}
      {renderServiceInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  distanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 6,
  },
  distanceDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#C7C7CC',
    marginHorizontal: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
});

export default TripInfoCard;
