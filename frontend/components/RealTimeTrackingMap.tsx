import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { locationService, LocationData, TrackingSession } from '@/services/locationService';

const { width, height } = Dimensions.get('window');

interface RealTimeTrackingMapProps {
  requestId: string;
  providerId: string;
  clientId: string;
  initialProviderLocation?: LocationData;
  initialClientLocation?: LocationData;
  onTrackingStart?: () => void;
  onTrackingStop?: () => void;
  onLocationUpdate?: (location: LocationData) => void;
  isProvider?: boolean; // Se true, mostra controles de rastreamento
}

export const RealTimeTrackingMap: React.FC<RealTimeTrackingMapProps> = ({
  requestId,
  providerId,
  clientId,
  initialProviderLocation,
  initialClientLocation,
  onTrackingStart,
  onTrackingStop,
  onLocationUpdate,
  isProvider = false,
}) => {
  const mapRef = useRef<MapView>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [providerLocation, setProviderLocation] = useState<LocationData | null>(
    initialProviderLocation || null
  );
  const [clientLocation, setClientLocation] = useState<LocationData | null>(
    initialClientLocation || null
  );
  const [routePoints, setRoutePoints] = useState<LocationData[]>([]);
  const [trackingSession, setTrackingSession] = useState<TrackingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  useEffect(() => {
    initializeMap();
    loadActiveSession();

    return () => {
      if (isTracking) {
        handleStopTracking();
      }
    };
  }, []);

  useEffect(() => {
    if (providerLocation && clientLocation) {
      fitMapToMarkers();
    }
  }, [providerLocation, clientLocation]);

  const initializeMap = () => {
    if (initialProviderLocation || initialClientLocation) {
      const location = initialProviderLocation || initialClientLocation!;
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const loadActiveSession = async () => {
    try {
      const session = await locationService.getActiveTrackingSession(requestId);
      if (session) {
        setTrackingSession(session);
        setRoutePoints(session.route_points || []);
        setIsTracking(session.status === 'active');
      }
    } catch (error) {
      console.error('❌ [TRACKING] Erro ao carregar sessão ativa:', error);
    }
  };

  const handleStartTracking = async () => {
    if (isTracking) return;

    setLoading(true);
    try {
      const success = await locationService.startTracking(requestId, (location) => {
        setProviderLocation(location);
        setRoutePoints(prev => [...prev, location]);
        
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      });

      if (success) {
        setIsTracking(true);
        if (onTrackingStart) {
          onTrackingStart();
        }
        Alert.alert('✅ Rastreamento Iniciado', 'Sua localização está sendo compartilhada.');
      } else {
        Alert.alert('❌ Erro', 'Não foi possível iniciar o rastreamento.');
      }
    } catch (error) {
      console.error('❌ [TRACKING] Erro ao iniciar rastreamento:', error);
      Alert.alert('❌ Erro', 'Erro ao iniciar rastreamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTracking = async () => {
    if (!isTracking) return;

    setLoading(true);
    try {
      await locationService.stopTracking();
      setIsTracking(false);
      
      if (onTrackingStop) {
        onTrackingStop();
      }
      
      Alert.alert('✅ Rastreamento Parado', 'O compartilhamento de localização foi interrompido.');
    } catch (error) {
      console.error('❌ [TRACKING] Erro ao parar rastreamento:', error);
      Alert.alert('❌ Erro', 'Erro ao parar rastreamento.');
    } finally {
      setLoading(false);
    }
  };

  const fitMapToMarkers = () => {
    if (!mapRef.current || !providerLocation || !clientLocation) return;

    const coordinates = [
      { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
      { latitude: clientLocation.latitude, longitude: clientLocation.longitude },
    ];

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  const centerOnProvider = () => {
    if (!mapRef.current || !providerLocation) return;

    mapRef.current.animateToRegion({
      latitude: providerLocation.latitude,
      longitude: providerLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const centerOnClient = () => {
    if (!mapRef.current || !clientLocation) return;

    mapRef.current.animateToRegion({
      latitude: clientLocation.latitude,
      longitude: clientLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const calculateDistance = (loc1: LocationData, loc2: LocationData): string => {
    const R = 6371; // Raio da Terra em km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  const renderTrackingControls = () => {
    if (!isProvider) return null;

    return (
      <View style={styles.trackingControls}>
        <TouchableOpacity
          style={[
            styles.trackingButton,
            isTracking ? styles.stopButton : styles.startButton,
            loading && styles.disabledButton,
          ]}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={isTracking ? 'stop' : 'play'}
                size={20}
                color="#fff"
              />
              <Text style={styles.trackingButtonText}>
                {isTracking ? 'Parar Rastreamento' : 'Iniciar Rastreamento'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderMapControls = () => (
    <View style={styles.mapControls}>
      {providerLocation && (
        <TouchableOpacity style={styles.controlButton} onPress={centerOnProvider}>
          <Ionicons name="car" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}
      
      {clientLocation && (
        <TouchableOpacity style={styles.controlButton} onPress={centerOnClient}>
          <Ionicons name="person" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.controlButton} onPress={fitMapToMarkers}>
        <Ionicons name="resize" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderDistanceInfo = () => {
    if (!providerLocation || !clientLocation) return null;

    const distance = calculateDistance(providerLocation, clientLocation);

    return (
      <View style={styles.distanceInfo}>
        <Ionicons name="location" size={16} color="#007AFF" />
        <Text style={styles.distanceText}>Distância: {distance}</Text>
        {isTracking && (
          <View style={styles.trackingIndicator}>
            <View style={styles.trackingDot} />
            <Text style={styles.trackingText}>Rastreando</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Marcador do Prestador */}
        {providerLocation && (
          <Marker
            coordinate={{
              latitude: providerLocation.latitude,
              longitude: providerLocation.longitude,
            }}
            title="Prestador"
            description="Localização atual do prestador"
            pinColor="#007AFF"
          >
            <View style={styles.providerMarker}>
              <Ionicons name="car" size={24} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Marcador do Cliente */}
        {clientLocation && (
          <Marker
            coordinate={{
              latitude: clientLocation.latitude,
              longitude: clientLocation.longitude,
            }}
            title="Cliente"
            description="Localização do cliente"
            pinColor="#34C759"
          >
            <View style={styles.clientMarker}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Rota percorrida */}
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor="#007AFF"
            strokeWidth={3}
            strokePattern={[1]}
          />
        )}
      </MapView>

      {/* Informações de distância */}
      {renderDistanceInfo()}

      {/* Controles do mapa */}
      {renderMapControls()}

      {/* Controles de rastreamento */}
      {renderTrackingControls()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  distanceInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  trackingText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    top: 120,
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingControls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  trackingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  providerMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  clientMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
});

export default RealTimeTrackingMap;
