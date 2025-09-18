import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface ProviderAnimatedMapViewProps {
  visible: boolean;
  providerLocation: Location;
  clientLocation: Location;
  clientName?: string;
  category?: string;
  onComplete?: () => void;
}

export default function ProviderAnimatedMapView({
  visible,
  providerLocation,
  clientLocation,
  clientName = 'Cliente',
  category = 'Serviço',
  onComplete,
}: ProviderAnimatedMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const [currentPhase, setCurrentPhase] = useState(0);

  const phases = [
    {
      title: 'Calculando rota...',
      subtitle: 'Encontrando o melhor caminho',
      region: {
        latitude: (providerLocation.latitude + clientLocation.latitude) / 2,
        longitude: (providerLocation.longitude + clientLocation.longitude) / 2,
        latitudeDelta: Math.abs(providerLocation.latitude - clientLocation.latitude) * 2 + 0.01,
        longitudeDelta: Math.abs(providerLocation.longitude - clientLocation.longitude) * 2 + 0.01,
      },
    },
    {
      title: 'Rota calculada!',
      subtitle: `Indo para ${clientName}`,
      region: {
        latitude: (providerLocation.latitude + clientLocation.latitude) / 2,
        longitude: (providerLocation.longitude + clientLocation.longitude) / 2,
        latitudeDelta: Math.abs(providerLocation.latitude - clientLocation.latitude) * 1.5 + 0.005,
        longitudeDelta: Math.abs(providerLocation.longitude - clientLocation.longitude) * 1.5 + 0.005,
      },
    },
    {
      title: 'Chegando ao destino',
      subtitle: `${category} • Local do cliente`,
      region: {
        latitude: clientLocation.latitude,
        longitude: clientLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
    },
  ];

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      resetAnimation();
    }
  }, [visible]);

  const startAnimation = () => {
    // Animação inicial
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animar header
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 200);

    // Sequência de fases
    animatePhases();
  };

  const animatePhases = () => {
    const animatePhase = (phaseIndex: number) => {
      if (phaseIndex >= phases.length) {
        // Completar animação
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1000);
        return;
      }

      setCurrentPhase(phaseIndex);
      
      // Animar para a região da fase atual
      if (mapRef.current) {
        mapRef.current.animateToRegion(phases[phaseIndex].region, 1000);
      }

      // Próxima fase após delay
      setTimeout(() => {
        animatePhase(phaseIndex + 1);
      }, 2000);
    };

    animatePhase(0);
  };

  const resetAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    headerOpacity.setValue(0);
    setCurrentPhase(0);
  };

  if (!visible) return null;

  const currentPhaseData = phases[currentPhase];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header animado */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="car" size={24} color="#007AFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{currentPhaseData.title}</Text>
                <Text style={styles.subtitle}>{currentPhaseData.subtitle}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Mapa */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={phases[0].region}
              showsUserLocation={false}
              showsMyLocationButton={false}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {/* Marcador do prestador */}
              <Marker
                coordinate={providerLocation}
                title="Você"
                description="Sua localização"
              >
                <View style={styles.providerMarker}>
                  <Ionicons name="car" size={20} color="#fff" />
                </View>
              </Marker>

              {/* Marcador do cliente */}
              <Marker
                coordinate={clientLocation}
                title={clientName}
                description={category}
              >
                <View style={styles.clientMarker}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              </Marker>
            </MapView>

            {/* Overlay de loading para primeira fase */}
            {currentPhase === 0 && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingContent}>
                  <Animated.View style={styles.loadingSpinner}>
                    <Ionicons name="refresh" size={32} color="#007AFF" />
                  </Animated.View>
                  <Text style={styles.loadingText}>Calculando melhor rota...</Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer com informações */}
          <Animated.View style={[styles.footer, { opacity: headerOpacity }]}>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{clientName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="construct-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{category}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {calculateDistance(providerLocation, clientLocation).toFixed(1)}km
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Função para calcular distância entre dois pontos
function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  providerMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
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
  clientMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
});
