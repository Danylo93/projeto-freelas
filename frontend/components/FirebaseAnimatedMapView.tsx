import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { useRealtimeProviderLocation } from '../hooks/useFirebaseRealtime';

interface FirebaseAnimatedMapViewProps {
  providerId: string | null;
  clientLocation: { lat: number; lng: number };
  onLocationUpdate?: (location: { lat: number; lng: number; heading?: number }) => void;
  showPolyline?: boolean;
  followProvider?: boolean;
}

const { width, height } = Dimensions.get('window');

export const FirebaseAnimatedMapView: React.FC<FirebaseAnimatedMapViewProps> = ({
  providerId,
  clientLocation,
  onLocationUpdate,
  showPolyline = true,
  followProvider = true
}) => {
  const mapRef = useRef<MapView>(null);
  const [providerLocation, setProviderLocation] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: clientLocation.lat,
    longitude: clientLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Animated values for smooth marker movement
  const markerLat = useSharedValue(clientLocation.lat);
  const markerLng = useSharedValue(clientLocation.lng);
  const markerHeading = useSharedValue(0);

  // Subscribe to provider location updates
  useRealtimeProviderLocation(providerId, (data) => {
    if (data && data.lat && data.lng) {
      const newLocation = {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading || 0
      };

      setProviderLocation(newLocation);
      onLocationUpdate?.(newLocation);

      // Animate marker to new position
      markerLat.value = withTiming(data.lat, { duration: 500 });
      markerLng.value = withTiming(data.lng, { duration: 500 });
      markerHeading.value = withTiming(data.heading || 0, { duration: 500 });

      // Follow provider if enabled
      if (followProvider && mapRef.current) {
        runOnJS(() => {
          mapRef.current?.animateCamera({
            center: {
              latitude: data.lat,
              longitude: data.lng,
            },
            pitch: 0,
            heading: data.heading || 0,
            altitude: 1000,
          });
        })();
      }
    }
  });

  // Animated marker style
  const animatedMarkerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${markerHeading.value}deg` },
        { scale: interpolate(markerHeading.value, [0, 360], [1, 1.1]) }
      ],
    };
  });

  // Calculate polyline coordinates
  const polylineCoordinates = providerLocation 
    ? [
        { latitude: clientLocation.lat, longitude: clientLocation.lng },
        { latitude: providerLocation.lat, longitude: providerLocation.lng }
      ]
    : [];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        mapType="standard"
        onRegionChangeComplete={setRegion}
      >
        {/* Client marker */}
        <Marker
          coordinate={clientLocation}
          title="Você"
          description="Sua localização"
          pinColor="blue"
        />

        {/* Provider marker with animation */}
        {providerLocation && (
          <Marker
            coordinate={{
              latitude: markerLat.value,
              longitude: markerLng.value,
            }}
            title="Prestador"
            description="Prestador de serviço"
            pinColor="green"
          >
            <Animated.View style={[styles.providerMarker, animatedMarkerStyle]}>
              <View style={styles.carIcon}>
                <View style={styles.carBody} />
                <View style={styles.carRoof} />
              </View>
            </Animated.View>
          </Marker>
        )}

        {/* Polyline between client and provider */}
        {showPolyline && polylineCoordinates.length === 2 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#007AFF"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  providerMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: {
    width: 30,
    height: 20,
    position: 'relative',
  },
  carBody: {
    width: 30,
    height: 15,
    backgroundColor: '#34C759',
    borderRadius: 8,
    position: 'absolute',
    top: 5,
  },
  carRoof: {
    width: 20,
    height: 10,
    backgroundColor: '#34C759',
    borderRadius: 4,
    position: 'absolute',
    top: 0,
    left: 5,
  },
});
