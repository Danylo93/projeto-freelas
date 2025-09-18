import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  providerLocation: Location;
  clientLocation: Location;
  clientName?: string;
  category?: string;
  distance?: number;
}

export default function MapModal({
  visible,
  onClose,
  providerLocation,
  clientLocation,
  clientName = 'Cliente',
  category = 'Serviço',
  distance,
}: MapModalProps) {
  const mapRef = React.useRef<MapView>(null);

  React.useEffect(() => {
    if (visible && mapRef.current) {
      // Ajustar o mapa para mostrar ambos os pontos
      const region = {
        latitude: (providerLocation.latitude + clientLocation.latitude) / 2,
        longitude: (providerLocation.longitude + clientLocation.longitude) / 2,
        latitudeDelta: Math.abs(providerLocation.latitude - clientLocation.latitude) * 1.5 + 0.01,
        longitudeDelta: Math.abs(providerLocation.longitude - clientLocation.longitude) * 1.5 + 0.01,
      };
      
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 500);
    }
  }, [visible]);

  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculatedDistance = distance || calculateDistance(providerLocation, clientLocation);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Localização do Cliente</Text>
            <Text style={styles.headerSubtitle}>{category} • {clientName}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={false}
            showsMyLocationButton={false}
            initialRegion={{
              latitude: (providerLocation.latitude + clientLocation.latitude) / 2,
              longitude: (providerLocation.longitude + clientLocation.longitude) / 2,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {/* Marcador do prestador */}
            <Marker
              coordinate={providerLocation}
              title="Você"
              description="Sua localização atual"
            >
              <View style={styles.providerMarker}>
                <Ionicons name="car" size={20} color="#fff" />
              </View>
            </Marker>

            {/* Marcador do cliente */}
            <Marker
              coordinate={clientLocation}
              title={clientName}
              description={`${category} - Cliente`}
            >
              <View style={styles.clientMarker}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            </Marker>
          </MapView>
        </View>

        {/* Footer com informações */}
        <View style={styles.footer}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Cliente</Text>
                <Text style={styles.infoValue}>{clientName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="construct-outline" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Serviço</Text>
                <Text style={styles.infoValue}>{category}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Distância</Text>
                <Text style={styles.infoValue}>{calculatedDistance.toFixed(1)}km</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Tempo estimado</Text>
                <Text style={styles.infoValue}>{Math.ceil(calculatedDistance * 2)}min</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.directionsButton} onPress={onClose}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.directionsButtonText}>Abrir no GPS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

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
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clientMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
