import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RealTimeTrackingMap } from './RealTimeTrackingMap';
import { LocationData } from '@/services/locationService';

interface TrackingMapModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  providerId: string;
  clientId: string;
  providerName: string;
  clientName: string;
  serviceDescription: string;
  initialProviderLocation?: LocationData;
  initialClientLocation?: LocationData;
  isProvider?: boolean;
}

export const TrackingMapModal: React.FC<TrackingMapModalProps> = ({
  visible,
  onClose,
  requestId,
  providerId,
  clientId,
  providerName,
  clientName,
  serviceDescription,
  initialProviderLocation,
  initialClientLocation,
  isProvider = false,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      calculateEstimatedArrival();
    }
  }, [visible, currentLocation]);

  const calculateEstimatedArrival = () => {
    if (!currentLocation || !initialClientLocation) return;

    // Cálculo simples de ETA baseado na distância
    // Em uma implementação real, você usaria APIs de roteamento
    const distance = calculateDistance(currentLocation, initialClientLocation);
    const averageSpeed = 30; // km/h média na cidade
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 60) {
      setEstimatedArrival(`${timeInMinutes} min`);
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      setEstimatedArrival(`${hours}h ${minutes}min`);
    }
  };

  const calculateDistance = (loc1: LocationData, loc2: LocationData): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleTrackingStart = () => {
    setIsTracking(true);
  };

  const handleTrackingStop = () => {
    setIsTracking(false);
    setEstimatedArrival(null);
  };

  const handleLocationUpdate = (location: LocationData) => {
    setCurrentLocation(location);
  };

  const handleClose = () => {
    if (isTracking && isProvider) {
      Alert.alert(
        'Rastreamento Ativo',
        'O rastreamento está ativo. Deseja realmente fechar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fechar', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>
          {isProvider ? 'Rastreamento do Serviço' : 'Acompanhar Prestador'}
        </Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {serviceDescription}
        </Text>
      </View>

      <View style={styles.headerRight}>
        {isTracking && (
          <View style={styles.trackingStatus}>
            <View style={styles.trackingDot} />
            <Text style={styles.trackingStatusText}>Ativo</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderServiceInfo = () => (
    <View style={styles.serviceInfo}>
      <View style={styles.serviceInfoRow}>
        <View style={styles.serviceInfoItem}>
          <Ionicons name="person" size={16} color="#007AFF" />
          <Text style={styles.serviceInfoLabel}>
            {isProvider ? 'Cliente' : 'Prestador'}
          </Text>
          <Text style={styles.serviceInfoValue}>
            {isProvider ? clientName : providerName}
          </Text>
        </View>

        {estimatedArrival && (
          <View style={styles.serviceInfoItem}>
            <Ionicons name="time" size={16} color="#FF9500" />
            <Text style={styles.serviceInfoLabel}>ETA</Text>
            <Text style={styles.serviceInfoValue}>{estimatedArrival}</Text>
          </View>
        )}
      </View>

      {isProvider && !isTracking && (
        <View style={styles.trackingHint}>
          <Ionicons name="information-circle" size={16} color="#8E8E93" />
          <Text style={styles.trackingHintText}>
            Inicie o rastreamento para compartilhar sua localização com o cliente
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {renderHeader()}
        
        <View style={styles.mapContainer}>
          <RealTimeTrackingMap
            requestId={requestId}
            providerId={providerId}
            clientId={clientId}
            initialProviderLocation={initialProviderLocation}
            initialClientLocation={initialClientLocation}
            onTrackingStart={handleTrackingStart}
            onTrackingStop={handleTrackingStop}
            onLocationUpdate={handleLocationUpdate}
            isProvider={isProvider}
          />
        </View>

        {renderServiceInfo()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerRight: {
    marginLeft: 12,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trackingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  trackingStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
  },
  mapContainer: {
    flex: 1,
  },
  serviceInfo: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  serviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceInfoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  serviceInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  trackingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  trackingHintText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    lineHeight: 18,
  },
});

export default TrackingMapModal;
