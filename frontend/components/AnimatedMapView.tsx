import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Provider {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance?: number;
  status: 'online' | 'offline' | 'busy';
}

interface AnimatedMapViewProps {
  userLocation: {
    latitude: number;
    longitude: number;
  };
  providers: Provider[];
  onProviderSelect?: (provider: Provider) => void;
  searchPhase: 'searching' | 'zooming' | 'expanding' | 'showing' | 'complete';
}

export default function AnimatedMapView({
  userLocation,
  providers,
  onProviderSelect,
  searchPhase,
}: AnimatedMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.01, // Zoom inicial bem próximo
    longitudeDelta: 0.01,
  });

  const [showMarkers, setShowMarkers] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!mapRef.current) return;

    switch (searchPhase) {
      case 'searching':
        // Fase 1: Zoom bem próximo no usuário
        const searchRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        mapRef.current.animateToRegion(searchRegion, 1000);
        setRegion(searchRegion);
        break;

      case 'zooming':
        // Fase 2: Zoom out gradual
        const zoomRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        mapRef.current.animateToRegion(zoomRegion, 1500);
        setRegion(zoomRegion);
        break;

      case 'expanding':
        // Fase 3: Expandir para mostrar área maior
        const expandRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        mapRef.current.animateToRegion(expandRegion, 2000);
        setRegion(expandRegion);
        break;

      case 'showing':
        // Fase 4: Mostrar marcadores com animação
        setShowMarkers(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
        break;

      case 'complete':
        // Fase 5: Ajustar para mostrar todos os profissionais
        if (providers.length > 0) {
          const coordinates = [
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            ...providers.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
          ];
          
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          });
        }
        break;
    }
  }, [searchPhase, providers, userLocation]);

  const getMarkerColor = (provider: Provider) => {
    switch (provider.status) {
      case 'online': return '#00C851';
      case 'busy': return '#FF8800';
      case 'offline': return '#999';
      default: return '#007AFF';
    }
  };

  const getMarkerIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Encanador': 'water',
      'Eletricista': 'flash',
      'Limpeza': 'sparkles',
      'Jardinagem': 'leaf',
      'Pintura': 'brush',
      'Reformas': 'hammer',
    };
    return iconMap[category] || 'person';
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="standard"
      >
        {/* Marcadores dos profissionais */}
        {showMarkers && providers.map((provider, index) => (
          <Marker
            key={provider.id}
            coordinate={{
              latitude: provider.latitude,
              longitude: provider.longitude,
            }}
            onPress={() => onProviderSelect?.(provider)}
          >
            <Animated.View
              style={[
                styles.markerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: fadeAnim }],
                },
              ]}
            >
              {/* Círculo de status */}
              <View
                style={[
                  styles.markerCircle,
                  { backgroundColor: getMarkerColor(provider) },
                ]}
              >
                <Ionicons
                  name={getMarkerIcon(provider.category) as any}
                  size={20}
                  color="#fff"
                />
              </View>

              {/* Indicador de status */}
              {provider.status === 'online' && (
                <View style={styles.onlineIndicator} />
              )}

              {/* Callout com informações */}
              <View style={styles.callout}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerCategory}>{provider.category}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.rating}>{provider.rating.toFixed(1)}</Text>
                  {provider.distance && (
                    <Text style={styles.distance}>
                      • {provider.distance.toFixed(1)}km
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>
          </Marker>
        ))}
      </MapView>

      {/* Overlay de informações */}
      {searchPhase !== 'complete' && (
        <View style={styles.overlay}>
          <View style={styles.infoContainer}>
            <Text style={styles.phaseText}>
              {searchPhase === 'searching' && '🔍 Localizando você...'}
              {searchPhase === 'zooming' && '📍 Analisando região...'}
              {searchPhase === 'expanding' && '🗺️ Expandindo busca...'}
              {searchPhase === 'showing' && '👥 Encontrando profissionais...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C851',
    borderWidth: 2,
    borderColor: '#fff',
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  providerCategory: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 10,
    color: '#333',
    marginLeft: 2,
  },
  distance: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
