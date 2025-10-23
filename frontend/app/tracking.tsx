import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useTrackingStore } from '../src/stores/trackingStore';
import { useServiceStore } from '../src/stores/serviceStore';
import { useRatingStore } from '../src/stores/ratingStore';
import { useLocationStore } from '../src/stores/locationStore';
import { GeocodingService } from '../src/services/geocodingService';

const { width, height } = Dimensions.get('window');

export default function TrackingScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const { 
    vehicleLocation, 
    driverInfo, 
    routeUpdate, 
    startTracking, 
    stopTracking,
    isTracking 
  } = useTrackingStore();
  const { currentService } = useServiceStore();
  const { loadCategories } = useRatingStore();
  const { currentLocation } = useLocationStore();
  
  const [hasArrived, setHasArrived] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [currentVehiclePosition, setCurrentVehiclePosition] = useState<{latitude: number; longitude: number} | null>(null);
  const [vehicleHeading, setVehicleHeading] = useState(0);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [showInitialAnimation, setShowInitialAnimation] = useState(true);
  const [isVehicleMoving, setIsVehicleMoving] = useState(false);
  
  // Animações
  const carPulse = useSharedValue(1);
  const cardTranslateY = useSharedValue(50);
  const progressBar = useSharedValue(0);
  const markerPulse = useSharedValue(1);
  const carPosition = useSharedValue({ x: 0, y: 0 });

  useEffect(() => {
    if (currentService) {
      initializeTracking();
    }
  }, [currentService]);

  useEffect(() => {
    if (hasArrived) {
      setShowRating(true);
    }
  }, [hasArrived]);

  const initializeTracking = async () => {
    if (!currentService) return;
    
    try {
      await startTracking(currentService);
      cardTranslateY.value = withSpring(0, { damping: 15 });
      
      // Iniciar animação do mapa
      startMapAnimation();
      
      // Iniciar animação de pulso dos marcadores
      startMarkerAnimation();
    } catch (error) {
      console.error('Erro ao inicializar tracking:', error);
    }
  };

  const startMapAnimation = () => {
    if (!currentLocation || !currentService?.destination) return;
    
    // 1. Mostrar panorama geral (origem e destino)
    const origin = currentLocation;
    const destination = currentService.destination;
    
    // Calcular região que mostra origem e destino
    const minLat = Math.min(origin.latitude, destination.latitude);
    const maxLat = Math.max(origin.latitude, destination.latitude);
    const minLng = Math.min(origin.longitude, destination.longitude);
    const maxLng = Math.max(origin.longitude, destination.longitude);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.5; // Margem extra
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.5;
    
    setMapRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    });
    
    // 2. Após 2 segundos, focar na localização atual
    setTimeout(() => {
      setMapRegion({
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      // 3. Após mais 1 segundo, iniciar a corrida
      setTimeout(() => {
        setShowInitialAnimation(false);
        loadRoute();
      }, 1000);
    }, 2000);
  };

  const loadRoute = async () => {
    if (!currentLocation || !currentService?.destination) {
      console.log('Localização ou destino não disponível');
      return;
    }
    
    console.log('Carregando rota...');
    setIsLoadingRoute(true);
    
    // Sempre gerar rota simulada primeiro para garantir que funcione
    const simulatedRoute = generateSimulatedRoute(currentLocation, currentService.destination);
    setRouteCoordinates(simulatedRoute);
    setCurrentVehiclePosition(simulatedRoute[0]);
    
    // Tentar buscar rota real em paralelo
    try {
      const directions = await GeocodingService.getDirections(
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        { lat: currentService.destination.latitude, lng: currentService.destination.longitude }
      );
      
      if (directions && directions.polyline) {
        console.log('Rota real encontrada, atualizando...');
        setRouteInfo(directions);
        const decodedRoute = GeocodingService.decodePolyline(directions.polyline);
        setRouteCoordinates(decodedRoute);
        setCurrentVehiclePosition(decodedRoute[0]);
        // Usar rota real se encontrada
        simulateVehicleMovement(decodedRoute);
      } else {
        // Usar rota simulada
        simulateVehicleMovement(simulatedRoute);
      }
    } catch (error) {
      console.log('Usando rota simulada');
      simulateVehicleMovement(simulatedRoute);
    }
    
    setIsLoadingRoute(false);
  };

  const generateSimulatedRoute = (origin: any, destination: any) => {
    const steps = 20; // Mais pontos para movimento mais suave
    const route = [];
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = origin.latitude + (destination.latitude - origin.latitude) * progress;
      const lng = origin.longitude + (destination.longitude - origin.longitude) * progress;
      
      route.push({
        latitude: lat,
        longitude: lng,
      });
    }
    
    console.log('Rota simulada gerada com', route.length, 'pontos');
    console.log('Primeira posição:', route[0]);
    console.log('Última posição:', route[route.length - 1]);
    return route;
  };

  const simulateVehicleMovement = (route: string | any[]) => {
    // Evitar múltiplas instâncias
    if (isVehicleMoving) {
      console.log('Veículo já está em movimento, ignorando nova chamada');
      return;
    }
    
    setIsVehicleMoving(true);
    let currentIndex = 0;
    const totalSteps = route.length;
    setCurrentRouteIndex(0);
    setIsOffRoute(false);
    
    console.log('Iniciando movimento do veículo com', totalSteps, 'pontos');
    
    // Função para mover o carro suavemente
    const moveCar = () => {
      if (currentIndex < totalSteps - 1) {
        currentIndex++;
        setCurrentRouteIndex(currentIndex);
        
        // Seguir exatamente a rota
        const nextPosition = route[currentIndex];
        console.log(`Movendo carro para posição ${currentIndex}:`, nextPosition);
        setCurrentVehiclePosition(nextPosition);
        
        // Atualizar região do mapa para acompanhar o carro
        setMapRegion({
          latitude: nextPosition.latitude,
          longitude: nextPosition.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        });
        
        // Atualizar progresso
        progressBar.value = withTiming(currentIndex / totalSteps, { duration: 800 });
        
        // Calcular direção do veículo
        if (currentIndex > 0) {
          const prev = route[currentIndex - 1];
          const current = route[currentIndex];
          const heading = calculateHeading(prev, current);
          setVehicleHeading(heading);
        }
        
        // Verificar se chegou ao destino
        if (currentIndex === totalSteps - 1) {
          setHasArrived(true);
          setIsVehicleMoving(false);
          return;
        }
        
        // Continuar movimento com delay maior
        setTimeout(moveCar, 4000); // 4 segundos entre movimentos
      } else {
        setIsVehicleMoving(false);
      }
    };
    
    // Iniciar movimento
    setTimeout(moveCar, 2000); // Primeiro movimento após 2 segundos
  };

  const handleOffRoute = async (currentPosition: {latitude: number; longitude: number}, destination: {latitude: number; longitude: number}) => {
    try {
      console.log('Buscando rota alternativa...');
      const alternativeRoute = await GeocodingService.getDirections(
        { lat: currentPosition.latitude, lng: currentPosition.longitude },
        { lat: destination.latitude, lng: destination.longitude }
      );
      
      if (alternativeRoute && alternativeRoute.polyline) {
        console.log('Rota alternativa encontrada');
        const newRoute = GeocodingService.decodePolyline(alternativeRoute.polyline);
        setRouteCoordinates(newRoute);
        setRouteInfo(alternativeRoute);
        setIsOffRoute(false);
        
        // Continuar movimento com nova rota
        simulateVehicleMovement(newRoute);
      } else {
        // Se não conseguir rota alternativa, gerar uma simulada
        console.log('Gerando rota alternativa simulada');
        const simulatedRoute = generateSimulatedRoute(currentPosition, destination);
        setRouteCoordinates(simulatedRoute);
        setIsOffRoute(false);
        simulateVehicleMovement(simulatedRoute);
      }
    } catch (error) {
      console.log('Erro ao buscar rota alternativa, usando simulada');
      const simulatedRoute = generateSimulatedRoute(currentPosition, destination);
      setRouteCoordinates(simulatedRoute);
      setIsOffRoute(false);
      simulateVehicleMovement(simulatedRoute);
    }
  };

  const calculateHeading = (from: { latitude: number; longitude: number; }, to: { latitude: number; longitude: number; }) => {
    const lat1 = from.latitude * Math.PI / 180;
    const lat2 = to.latitude * Math.PI / 180;
    const deltaLng = (to.longitude - from.longitude) * Math.PI / 180;
    
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  };

  const startMarkerAnimation = () => {
    markerPulse.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1000 }),
        withTiming(1.0, { duration: 1000 })
      ),
      -1,
      true
    );
  };

  const startCarAnimation = () => {
    carPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 })
      ),
      -1,
      true
    );
  };

  const handleCancelService = () => {
    Alert.alert(
      'Cancelar Serviço',
      'Tem certeza que deseja cancelar este serviço?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            await stopTracking();
            router.back();
          }
        }
      ]
    );
  };

  const handleCallDriver = () => {
    Alert.alert(
      'Ligar para o Motorista',
      `Ligar para ${driverInfo?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ligar', onPress: () => {
          console.log('Ligando para:', driverInfo?.phone);
        }}
      ]
    );
  };

  const handleRateService = (rating: number) => {
    console.log('Avaliação:', rating);
    setShowRating(false);
    router.replace('/client');
  };

  const animatedCarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: carPulse.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressBar.value * 100}%`,
  }));

  if (showRating) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={styles.ratingHeader}
        >
          <Text style={styles.ratingTitle}>Avalie o Serviço</Text>
        </LinearGradient>
        
        <View style={styles.ratingContent}>
          <Text style={styles.ratingText}>
            Como foi sua experiência com {driverInfo?.name}?
          </Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => handleRateService(star)}
              >
                <Text style={styles.star}>⭐</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleRateService(5)}
          >
            <Text style={styles.rateButtonText}>Avaliar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhando</Text>
        <TouchableOpacity 
          onPress={() => setIsCardVisible(!isCardVisible)} 
          style={styles.toggleButton}
        >
          <Text style={styles.toggleButtonText}>
            {isCardVisible ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={[styles.mapContainer, !isCardVisible && styles.mapContainerExpanded]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion || {
            latitude: currentVehiclePosition?.latitude || currentLocation?.latitude || -23.5505,
            longitude: currentVehiclePosition?.longitude || currentLocation?.longitude || -46.6333,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          
          {/* Marcador do destino */}
          {currentService?.destination && (
            <Marker
              coordinate={{
                latitude: currentService.destination.latitude,
                longitude: currentService.destination.longitude,
              }}
              title="Destino"
              pinColor="#4CAF50"
            >
              <View style={styles.destinationMarker}>
                <View style={styles.destinationIconContainer}>
                  <Text style={styles.destinationText}>🎯</Text>
                </View>
                {showInitialAnimation && (
                  <Animated.View style={[styles.markerPulse, styles.destinationPulse, { transform: [{ scale: markerPulse }] }]} />
                )}
              </View>
            </Marker>
          )}
          
          {/* Marcador do veículo */}
          {currentVehiclePosition && (
            <Marker
              coordinate={currentVehiclePosition}
              title={isOffRoute ? "Veículo - Recalculando" : "Veículo"}
              description={isOffRoute ? "Recalculando rota..." : `${driverInfo?.name} - ${driverInfo?.vehicleModel}`}
            >
              <Animated.View style={[styles.carMarker, animatedCarStyle]}>
                <View style={styles.carIconContainer}>
                  <Text style={styles.carIcon}>🚗</Text>
                </View>
                {currentRouteIndex > 0 && !isOffRoute && (
                  <View style={styles.movingIndicator}>
                    <Text style={styles.movingText}>→</Text>
                  </View>
                )}
              </Animated.View>
            </Marker>
          )}
          
          {/* Linha da rota - parte já percorrida (transparente) */}
          {routeCoordinates.length > 0 && currentRouteIndex > 0 && (
            <Polyline
              coordinates={routeCoordinates.slice(0, currentRouteIndex + 1)}
              strokeColor="rgba(0, 0, 0, 0.1)"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
          
          {/* Linha da rota - parte restante (preta) */}
          {routeCoordinates.length > 0 && currentRouteIndex < routeCoordinates.length - 1 && (
            <Polyline
              coordinates={routeCoordinates.slice(currentRouteIndex)}
              strokeColor="#000000"
              strokeWidth={6}
              lineDashPattern={[8, 4]}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
        
        {/* Loading overlay */}
        {(isLoadingRoute || showInitialAnimation) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>
              {showInitialAnimation ? 'Preparando corrida...' : 'Carregando rota...'}
            </Text>
          </View>
        )}
      </View>

      {/* Card do motorista */}
      {isCardVisible && (
        <Animated.View style={[styles.driverCard, animatedCardStyle]}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>
              {driverInfo?.name?.charAt(0) || 'J'}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driverInfo?.name || 'João Silva'}</Text>
            <Text style={styles.driverRating}>⭐ 4.8</Text>
            <Text style={styles.driverVehicle}>
              {driverInfo ? `${driverInfo.vehicleModel} • ${driverInfo.vehiclePlate}` : 'Honda Civic • ABC-1234'}
            </Text>
          </View>
        </View>
        
        {/* Informações da corrida */}
        <View style={styles.rideInfo}>
          <View style={styles.rideInfoRow}>
            <View style={styles.rideInfoItem}>
              <Text style={styles.rideInfoLabel}>Distância</Text>
              <Text style={styles.rideInfoValue}>
                {routeInfo ? routeInfo.distance : 'Calculando...'}
              </Text>
            </View>
            <View style={styles.rideInfoItem}>
              <Text style={styles.rideInfoLabel}>Tempo estimado</Text>
              <Text style={styles.rideInfoValue}>
                {routeInfo ? routeInfo.duration : 'Calculando...'}
              </Text>
            </View>
            <View style={styles.rideInfoItem}>
              <Text style={styles.rideInfoLabel}>Valor</Text>
              <Text style={styles.rideInfoValue}>
                R$ {currentService?.price?.toFixed(2) || '0,00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
          <Text style={styles.progressText}>
            {isOffRoute ? '🔄 Recalculando rota...' : 
             currentRouteIndex > 0 ? `🚗 Em movimento - ${Math.round(progressBar.value * 100)}% concluído` : 
             '📍 Aguardando início...'}
          </Text>
        </View>
        
        <View style={styles.driverActions}>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={handleCallDriver}
          >
            <Text style={styles.callButtonText}>Ligar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelService}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  toggleButtonText: {
    fontSize: 18,
    color: '#2196F3',
  },
  mapContainer: {
    height: height * 0.65, // Altura maior para mostrar mais do mapa
    position: 'relative',
  },
  mapContainerExpanded: {
    height: height * 0.85, // Altura ainda maior quando card está oculto
  },
  map: {
    flex: 1,
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  carMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIconContainer: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    padding: 12,
    elevation: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  carIcon: {
    fontSize: 24,
    color: 'white',
  },
  carIconContainerOffRoute: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
    shadowColor: '#FF9800',
  },
  animatedMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    opacity: 0.3,
  },
  destinationPulse: {
    backgroundColor: '#4CAF50',
  },
  markerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  destinationIcon: {
    backgroundColor: '#4CAF50',
  },
  markerText: {
    fontSize: 16,
  },
  movingIndicator: {
    position: 'absolute',
    top: -10,
    right: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  movingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  destinationText: {
    fontSize: 20,
  },
  destinationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  driverCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: height * 0.25, // Limitar altura do card
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  driverInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#666',
  },
  rideInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rideInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rideInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  rideInfoLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  rideInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  driverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  callButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ratingHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  ratingContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  starButton: {
    marginHorizontal: 5,
  },
  star: {
    fontSize: 40,
  },
  rateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});