import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  providers?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    category: string;
    rating: number;
  }>;
  onLocationPress?: () => void;
  showProviders?: boolean;
  centerOnUser?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  providers = [],
  onLocationPress,
  showProviders = false,
  centerOnUser = true,
}) => {
  const mapAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Animação de entrada do mapa
    Animated.timing(mapAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => setMapReady(true));

    // Animação de pulso para localização do usuário
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const renderUserLocation = () => {
    if (!userLocation) return null;

    return (
      <View style={styles.userLocationContainer}>
        <Animated.View
          style={[
            styles.userLocationPulse,
            {
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        />
        <View style={styles.userLocationDot} />
      </View>
    );
  };

  const renderProviders = () => {
    if (!showProviders || !providers.length) return null;

    return providers.map((provider, index) => (
      <Animated.View
        key={provider.id}
        style={[
          styles.providerMarker,
          {
            opacity: mapAnimation,
            transform: [
              {
                translateY: mapAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.providerPin}>
          <Text style={styles.providerEmoji}>🔧</Text>
        </View>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <View style={styles.providerRating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{provider.rating}</Text>
          </View>
        </View>
      </Animated.View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Mapa simulado com gradiente */}
      <Animated.View
        style={[
          styles.mapContainer,
          {
            opacity: mapAnimation,
            transform: [
              {
                scale: mapAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Grid de ruas simulado */}
        <View style={styles.streetGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`h-${i}`} style={[styles.street, styles.horizontalStreet, { top: i * 60 }]} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.street, styles.verticalStreet, { left: i * 60 }]} />
          ))}
        </View>

        {/* Localização do usuário */}
        {renderUserLocation()}

        {/* Prestadores */}
        {renderProviders()}
      </Animated.View>

      {/* Controles do mapa */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onLocationPress}>
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="layers" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Indicador de carregamento */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <Animated.View
            style={[
              styles.loadingSpinner,
              {
                transform: [
                  {
                    rotate: mapAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="location" size={32} color="#007AFF" />
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    position: 'relative',
    overflow: 'hidden',
  },
  streetGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  street: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  horizontalStreet: {
    height: 2,
    width: '100%',
  },
  verticalStreet: {
    width: 2,
    height: '100%',
  },
  userLocationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  providerMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  providerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  providerEmoji: {
    fontSize: 18,
  },
  providerInfo: {
    marginTop: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 60,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
