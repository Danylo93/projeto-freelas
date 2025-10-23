import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useAuthStore } from '../src/stores/authStore';
import { useServiceStore } from '../src/stores/serviceStore';
import { useLocationStore } from '../src/stores/locationStore';
import { usePaymentStore } from '../src/stores/paymentStore';
import { ServiceCategory, Location as LocationType } from '../src/types';
import { GeocodingService, PlaceResult } from '../src/services/geocodingService';

const { width, height } = Dimensions.get('window');

export default function ClientHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { 
    currentService, 
    availableCategories, 
    createService, 
    loadCategories,
    isLoading 
  } = useServiceStore();
  const { currentLocation, getCurrentLocation, requestPermission } = useLocationStore();
  const { loadPaymentMethods } = usePaymentStore();
  
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originPlace, setOriginPlace] = useState<LocationType | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<LocationType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  
  // Autocomplete states
  const [originSuggestions, setOriginSuggestions] = useState<PlaceResult[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceResult[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [isLoadingOrigin, setIsLoadingOrigin] = useState(false);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);
  const [showRouteAnimation, setShowRouteAnimation] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Procurando melhor trajeto...');
  
  // Animações
  const mapOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const inputFocus = useSharedValue(0);

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      mapOpacity.value = withTiming(1, { duration: 1000 });
    }
  }, [currentLocation]);

  useEffect(() => {
    // Forçar atualização da localização a cada 5 segundos
    const interval = setInterval(() => {
      getCurrentLocation();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeScreen = async () => {
    try {
      console.log('Inicializando tela...');
      await Promise.all([
        loadCategories(),
        loadPaymentMethods(),
        requestPermission(),
        getCurrentLocation()
      ]);
      
      console.log('Categorias carregadas:', availableCategories);
      cardTranslateY.value = withSpring(0, { damping: 15 });
    } catch (error) {
      console.error('Erro ao inicializar tela:', error);
    }
  };

  const handleOriginChange = async (text: string) => {
    setOrigin(text);
    setShowOriginSuggestions(text.length > 1);
    
    if (text.length > 1) {
      setIsLoadingOrigin(true);
      try {
        console.log('Buscando sugestões para origem:', text);
        const suggestions = await GeocodingService.getPlacePredictions(text);
        console.log('Sugestões encontradas:', suggestions);
        setOriginSuggestions(suggestions);
      } catch (error) {
        console.error('Erro ao buscar sugestões de origem:', error);
      } finally {
        setIsLoadingOrigin(false);
      }
    } else {
      setOriginSuggestions([]);
    }
  };

  const handleDestinationChange = async (text: string) => {
    setDestination(text);
    setShowDestinationSuggestions(text.length > 1);
    
    if (text.length > 1) {
      setIsLoadingDestination(true);
      try {
        console.log('Buscando sugestões para destino:', text);
        const suggestions = await GeocodingService.getPlacePredictions(text);
        console.log('Sugestões encontradas:', suggestions);
        setDestinationSuggestions(suggestions);
      } catch (error) {
        console.error('Erro ao buscar sugestões de destino:', error);
      } finally {
        setIsLoadingDestination(false);
      }
    } else {
      setDestinationSuggestions([]);
    }
  };

  const handleOriginSelect = async (suggestion: PlaceResult) => {
    setOrigin(suggestion.description);
    setShowOriginSuggestions(false);
    inputFocus.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
    
    try {
      const details = await GeocodingService.getPlaceDetails(suggestion.place_id);
      if (details) {
        setOriginPlace({
          latitude: details.lat,
          longitude: details.lng,
          address: details.address
        });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da origem:', error);
    }
  };

  const calculateAndShowRoute = async () => {
    if (!originPlace || !destinationPlace) return;
    
    try {
      console.log('Calculando rota automaticamente...');
      setShowRouteAnimation(true);
      setIsCalculatingRoute(true);
      
      // Frases dinâmicas igual ao Uber
      const messages = [
        'Procurando melhor trajeto...',
        'Calculando rota mais rápida...',
        'Analisando trânsito...',
        'Encontrando caminho ideal...',
        'Quase pronto...'
      ];
      
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setLoadingMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 800);
      
      const directions = await GeocodingService.getDirections(
        { lat: originPlace.latitude, lng: originPlace.longitude },
        { lat: destinationPlace.latitude, lng: destinationPlace.longitude }
      );
      
      clearInterval(messageInterval);
      
      if (directions && directions.polyline) {
        console.log('Rota real encontrada');
        setLoadingMessage('Rota encontrada!');
        const decodedRoute = GeocodingService.decodePolyline(directions.polyline);
        setRouteCoordinates(decodedRoute);
        setRouteInfo(directions);
      } else {
        console.log('Usando rota simulada');
        setLoadingMessage('Rota encontrada!');
        const simulatedRoute = generateSimulatedRoute(originPlace, destinationPlace);
        setRouteCoordinates(simulatedRoute);
      }
      
      setTimeout(() => {
        setIsCalculatingRoute(false);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      setIsCalculatingRoute(false);
    }
  };

  const handleDestinationSelect = async (suggestion: PlaceResult) => {
    setDestination(suggestion.description);
    setShowDestinationSuggestions(false);
    inputFocus.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
    
    try {
      const details = await GeocodingService.getPlaceDetails(suggestion.place_id);
      if (details) {
        setDestinationPlace({
          latitude: details.lat,
          longitude: details.lng,
          address: details.address
        });
        
        // Calcular rota automaticamente quando selecionar destino
        if (originPlace) {
          await calculateAndShowRoute();
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do destino:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setDestination('📍 Minha localização atual');
      setDestinationPlace({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: 'Minha localização atual'
      });
      setShowDestinationSuggestions(false);
      inputFocus.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1.02, { duration: 200 })
      );
    }
  };

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    inputFocus.value = withSpring(1.05, { damping: 15 });
  };

  const handleRequestService = async () => {
    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria de serviço');
      return;
    }

    if (!originPlace) {
      Alert.alert('Erro', 'Selecione um local de origem');
      return;
    }

    if (!destinationPlace) {
      Alert.alert('Erro', 'Selecione um destino');
      return;
    }

    try {
      // Criar serviço e ir direto para pagamento
      const service = await createService(selectedCategory, originPlace, destinationPlace);
      console.log('Serviço criado:', service);
      router.push({
        pathname: '/payment',
        params: { serviceId: service.id }
      });
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      Alert.alert('Erro', 'Não foi possível criar o serviço');
    }
  };

  const generateSimulatedRoute = (origin: any, destination: any) => {
    const steps = 15;
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
    
    return route;
  };

  const animateMapToRoute = (origin: any, destination: any, route: any[]) => {
    console.log('Rota calculada e exibida no mapa');
    // Apenas mostrar a rota, sem animação complexa do mapa
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const animatedMapStyle = useAnimatedStyle(() => ({
    opacity: mapOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputFocus.value }],
  }));

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name}</Text>
            <Text style={styles.subtitle}>Como podemos ajudar?</Text>
          </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
          <Text style={styles.profileText}>👤</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Mapa */}
      <Animated.View style={[styles.mapContainer, animatedMapStyle]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={showRouteAnimation && routeCoordinates.length > 0 ? {
            latitude: (originPlace?.latitude + destinationPlace?.latitude) / 2,
            longitude: (originPlace?.longitude + destinationPlace?.longitude) / 2,
            latitudeDelta: Math.abs((destinationPlace?.latitude || 0) - (originPlace?.latitude || 0)) * 1.5 || 0.01,
            longitudeDelta: Math.abs((destinationPlace?.longitude || 0) - (originPlace?.longitude || 0)) * 1.5 || 0.01,
          } : {
            latitude: originPlace?.latitude || destinationPlace?.latitude || currentLocation?.latitude || -23.5505,
            longitude: originPlace?.longitude || destinationPlace?.longitude || currentLocation?.longitude || -46.6333,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {originPlace && (
            <Marker
              coordinate={{
                latitude: originPlace.latitude,
                longitude: originPlace.longitude,
              }}
              title="Prestador"
              pinColor="#2196F3"
            >
              <View style={styles.originMarker}>
                <Text style={styles.originText}>👨‍🔧</Text>
              </View>
            </Marker>
          )}
          
          {destinationPlace && (
            <Marker
              coordinate={{
                latitude: destinationPlace.latitude,
                longitude: destinationPlace.longitude,
              }}
              title="Você"
              pinColor="#4CAF50"
            >
              <View style={styles.destinationMarker}>
                <Text style={styles.destinationText}>📍</Text>
              </View>
            </Marker>
          )}
          
          {/* Linha da rota quando animação está ativa */}
          {showRouteAnimation && routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#000000"
              strokeWidth={6}
              lineDashPattern={[8, 4]}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
        
        {/* Loading overlay no mapa */}
        {isCalculatingRoute && (
          <View style={styles.mapLoadingOverlay}>
            <View style={styles.mapLoadingCard}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.mapLoadingText}>{loadingMessage}</Text>
            </View>
          </View>
        )}
        
      </Animated.View>

      {/* Campos de origem e destino */}
      <Animated.View style={[styles.inputContainer, animatedCardStyle]}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>De onde vem o prestador?</Text>
          <Animated.View style={[styles.inputField, animatedInputStyle]}>
            <TextInput
              style={styles.input}
              placeholder="📍 Digite o endereço do prestador"
              value={origin}
              onChangeText={handleOriginChange}
              placeholderTextColor="#666666"
              onFocus={() => setShowOriginSuggestions(origin.length > 1)}
              selectionColor="#2196F3"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {isLoadingOrigin && (
              <ActivityIndicator size="small" color="#2196F3" style={styles.loadingIndicator} />
            )}
          </Animated.View>
          
          {showOriginSuggestions && originSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {originSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.place_id}
                  style={styles.suggestionItem}
                  onPress={() => handleOriginSelect(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.inputWrapper}>
          <View style={styles.inputLabelContainer}>
            <Text style={styles.inputLabel}>Para onde o prestador deve vir?</Text>
            <TouchableOpacity 
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
            >
              <Text style={styles.currentLocationText}>📍 Usar minha localização</Text>
            </TouchableOpacity>
          </View>
          <Animated.View style={[styles.inputField, animatedInputStyle]}>
            <TextInput
              style={styles.input}
              placeholder="🎯 Digite seu endereço"
              value={destination}
              onChangeText={handleDestinationChange}
              placeholderTextColor="#666666"
              onFocus={() => setShowDestinationSuggestions(destination.length > 1)}
              selectionColor="#2196F3"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {isLoadingDestination && (
              <ActivityIndicator size="small" color="#2196F3" style={styles.loadingIndicator} />
            )}
          </Animated.View>
          
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {destinationSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.place_id}
                  style={styles.suggestionItem}
                  onPress={() => handleDestinationSelect(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Cards de serviço */}
      <Animated.View style={[styles.cardsContainer, animatedCardStyle]}>
        <Text style={styles.categoriesTitle}>
          Escolha o tipo de serviço: ({availableCategories.length} categorias)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          {availableCategories.length > 0 ? (
            availableCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.serviceCard,
                  selectedCategory?.id === category.id && styles.serviceCardSelected
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <View style={styles.serviceCardContent}>
                  <Text style={styles.serviceCardIcon}>🚗</Text>
                  <Text style={styles.serviceCardTitle}>{category.displayName}</Text>
                  <Text style={styles.serviceCardDescription}>{category.description}</Text>
                  <Text style={styles.serviceCardPrice}>
                    A partir de R$ {category.basePrice.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.loadingCategories}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>Carregando categorias...</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Botão de solicitar serviço */}
      {selectedCategory && (
        <Animated.View style={[styles.requestButtonContainer, animatedCardStyle]}>
          <TouchableOpacity
            style={[styles.requestButton, isLoading && styles.requestButtonDisabled]}
            onPress={handleRequestService}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.requestButtonGradient}
            >
              <Text style={styles.requestButtonText}>
                {isLoading ? 'Processando...' : 'Solicitar Serviço'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  profileText: {
    color: 'white',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
  mapContainer: {
    height: height * 0.35,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  map: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  currentLocationButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  currentLocationText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  inputField: {
    position: 'relative',
  },
  input: {
    borderWidth: 3,
    borderColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 55,
    fontWeight: '600',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    maxHeight: 200,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  suggestionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  cardsScroll: {
    paddingRight: 16,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    marginLeft: 4,
  },
  loadingCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: width * 0.6,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  serviceCardSelected: {
    borderColor: '#FF6B35',
    borderWidth: 3,
    backgroundColor: '#FFF3E0',
    elevation: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  serviceCardContent: {
    flex: 1,
    alignItems: 'center',
  },
  serviceCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  serviceCardDescription: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  serviceCardPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF6B35',
    textAlign: 'center',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  requestButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  requestButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  requestButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationText: {
    fontSize: 20,
  },
  originMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  originText: {
    fontSize: 20,
  },
  routeLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLoadingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  routeLoadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  routeLoadingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  routeFoundText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 8,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  mapLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
});