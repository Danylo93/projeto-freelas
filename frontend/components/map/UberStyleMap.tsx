import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

// Importação condicional para evitar erro na web
let MapView: any, Marker: any, Polyline: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== 'web') {
  const MapComponents = require('react-native-maps');
  MapView = MapComponents.default;
  Marker = MapComponents.Marker;
  Polyline = MapComponents.Polyline;
  PROVIDER_GOOGLE = MapComponents.PROVIDER_GOOGLE;
}
import { Ionicons } from '@expo/vector-icons';
import { distanceService, LocationCoords, DistanceInfo } from '../../services/distanceService';

interface UberStyleMapProps {
  clientLocation: LocationCoords;
  providerLocation?: LocationCoords;
  showRoute?: boolean;
  showDistanceInfo?: boolean;
  onRegionChange?: (region: any) => void;
  style?: any;
  mapType?: 'standard' | 'satellite' | 'hybrid';
}

export const UberStyleMap: React.FC<UberStyleMapProps> = ({
  clientLocation,
  providerLocation,
  showRoute = true,
  showDistanceInfo = true,
  onRegionChange,
  style,
  mapType = 'standard',
}) => {
  const mapRef = useRef<MapView>(null);
  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LocationCoords[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (clientLocation && providerLocation) {
      // Calcular informações de distância
      const info = distanceService.calculateDistanceInfo(clientLocation, providerLocation);
      setDistanceInfo(info);

      // Criar rota simples (linha reta - em produção usar Google Directions API)
      setRouteCoordinates([clientLocation, providerLocation]);

      // Ajustar região do mapa para mostrar ambos os pontos
      const region = distanceService.calculateMapRegion(clientLocation, providerLocation, 0.02);
      
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 500);

      // Animar entrada das informações
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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

  const renderDistanceInfo = () => {
    if (!showDistanceInfo || !distanceInfo || !providerLocation) return null;

    return (
      <Animated.View style={[styles.distanceCard, { opacity: fadeAnim }]}>
        <View style={styles.distanceHeader}>
          <Ionicons name="car" size={20} color="#007AFF" />
          <Text style={styles.distanceTitle}>Prestador a caminho</Text>
        </View>
        
        <View style={styles.distanceDetails}>
          <View style={styles.distanceItem}>
            <Text style={styles.distanceValue}>{distanceInfo.formattedDistance}</Text>
            <Text style={styles.distanceLabel}>Distância</Text>
          </View>
          
          <View style={styles.distanceDivider} />
          
          <View style={styles.distanceItem}>
            <Text style={styles.distanceValue}>{distanceInfo.formattedDuration}</Text>
            <Text style={styles.distanceLabel}>Tempo estimado</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderClientMarker = () => (
    <Marker
      coordinate={clientLocation}
      identifier="client"
      title="Você está aqui"
      description="Localização do cliente"
    >
      <View style={styles.clientMarker}>
        <View style={styles.clientMarkerInner}>
          <Ionicons name="person" size={16} color="#FFFFFF" />
        </View>
      </View>
    </Marker>
  );

  const renderProviderMarker = () => {
    if (!providerLocation) return null;

    return (
      <Marker
        coordinate={providerLocation}
        identifier="provider"
        title="Prestador"
        description="Localização do prestador"
      >
        <View style={styles.providerMarker}>
          <View style={styles.providerMarkerInner}>
            <Ionicons name="construct" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.providerMarkerArrow} />
        </View>
      </Marker>
    );
  };

  const renderRoute = () => {
    if (!showRoute || routeCoordinates.length < 2) return null;

    return (
      <Polyline
        coordinates={routeCoordinates}
        strokeColor="#007AFF"
        strokeWidth={4}
        strokePattern={[1, 1]}
        lineDashPhase={0}
      />
    );
  };

  // Renderizar versão web (placeholder)
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.webMapContainer}>
          <View style={styles.webMapPlaceholder}>
            <View style={styles.webMapIcon}>🗺️</View>
            <Text style={styles.webMapText}>
              Mapa disponível apenas no app mobile
            </Text>
            {showDistanceInfo && distanceInfo && (
              <View style={styles.webDistanceInfo}>
                <Text style={styles.webDistanceText}>
                  Distância: {distanceInfo.formattedDistance}
                </Text>
                <Text style={styles.webDistanceText}>
                  Tempo: {distanceInfo.formattedDuration}
                </Text>
              </View>
            )}
          </View>
        </View>
        {renderDistanceInfo()}
      </View>
    );
  }

  // Renderizar versão mobile com mapa real
  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        onRegionChangeComplete={onRegionChange}
        initialRegion={{
          latitude: clientLocation.latitude,
          longitude: clientLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {renderClientMarker()}
        {renderProviderMarker()}
        {renderRoute()}
      </MapView>

      {renderDistanceInfo()}
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
  webMapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  webMapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMapIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  webMapText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  webDistanceInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webDistanceText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  distanceCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  distanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  distanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  clientMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clientMarkerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerMarker: {
    alignItems: 'center',
  },
  providerMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  providerMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#007AFF',
    marginTop: -1,
  },
});

export default UberStyleMap;
