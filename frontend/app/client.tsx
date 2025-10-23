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
  const inputFocus = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const mapScale = useSharedValue(1);

  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + inputFocus.value * 0.02 }],
    borderColor: inputFocus.value > 0 ? '#2196F3' : '#E0E0E0',
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedMapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mapScale.value }],
  }));

  useEffect(() => {
    loadCategories();
    loadPaymentMethods();
    requestPermission();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      getCurrentLocation();
    }
  }, [currentLocation]);

  const handleOriginChange = async (text: string) => {
    setOrigin(text);
    setShowOriginSuggestions(text.length > 0);
    
    if (text.length > 0) {
      setIsLoadingOrigin(true);
      try {
        const suggestions = await GeocodingService.getPlacePredictions(text);
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
    setShowDestinationSuggestions(text.length > 0);
    
    if (text.length > 0) {
      setIsLoadingDestination(true);
      try {
        const suggestions = await GeocodingService.getPlacePredictions(text);
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

  const handleDestinationSelect = async (suggestion: PlaceResult) => {
    setDestination(suggestion.description);
    setShowDestinationSuggestions(false);
    
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

  const generateSimulatedRoute = (start: LocationType, end: LocationType) => {
    const steps = 20;
    const route = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * ratio;
      const lng = start.longitude + (end.longitude - start.longitude) * ratio;
      route.push({ latitude: lat, longitude: lng });
    }
    
    return route;
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

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header Profissional */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Olá, {user?.name}</Text>
              <Text style={styles.subtitle}>Como podemos ajudar hoje?</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => router.push('/profile')} 
              style={styles.profileButton}
            >
              <Text style={styles.profileText}>👤</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleLogout} 
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Mapa Interativo */}
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
          
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#2196F3"
              strokeWidth={4}
              lineDashPattern={[8, 4]}
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

      {/* Seção de Solicitação */}
      <View style={styles.requestSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Solicitar Serviço</Text>
          <Text style={styles.sectionSubtitle}>Preencha os dados abaixo para encontrar o prestador ideal</Text>
        </View>

        {/* Inputs de Origem e Destino */}
        <View style={styles.inputsContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>📍 De onde vem o prestador?</Text>
              <Text style={styles.inputHelper}>Endereço de origem do serviço</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite o endereço do prestador"
                placeholderTextColor="#999999"
                value={origin}
                onChangeText={handleOriginChange}
                onFocus={() => {
                  inputFocus.value = withSequence(
                    withTiming(1, { duration: 200 }),
                    withTiming(1.02, { duration: 200 })
                  );
                }}
                onBlur={() => {
                  inputFocus.value = withTiming(0, { duration: 200 });
                }}
                selectionColor="#2196F3"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isLoadingOrigin && (
                <ActivityIndicator size="small" color="#2196F3" style={styles.inputLoader} />
              )}
            </View>
            
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {originSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleOriginSelect(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>🎯 Para onde o prestador deve vir?</Text>
              <Text style={styles.inputHelper}>Seu endereço de destino</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite seu endereço"
                placeholderTextColor="#999999"
                value={destination}
                onChangeText={handleDestinationChange}
                onFocus={() => {
                  inputFocus.value = withSequence(
                    withTiming(1, { duration: 200 }),
                    withTiming(1.02, { duration: 200 })
                  );
                }}
                onBlur={() => {
                  inputFocus.value = withTiming(0, { duration: 200 });
                }}
                selectionColor="#2196F3"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isLoadingDestination && (
                <ActivityIndicator size="small" color="#2196F3" style={styles.inputLoader} />
              )}
              <TouchableOpacity 
                style={styles.currentLocationButton}
                onPress={handleUseCurrentLocation}
              >
                <Text style={styles.currentLocationIcon}>📍</Text>
                <Text style={styles.currentLocationText}>Usar minha localização</Text>
              </TouchableOpacity>
            </View>
            
            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {destinationSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleDestinationSelect(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Categorias de Serviços */}
      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias de Serviços</Text>
          <Text style={styles.sectionSubtitle}>Escolha o tipo de serviço que você precisa</Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Carregando categorias...</Text>
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory?.id === category.id && styles.categoryCardSelected
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>
                    {category.icon === 'wrench' ? '🔧' :
                     category.icon === 'sparkles' ? '✨' :
                     category.icon === 'hammer' ? '🔨' :
                     category.icon === 'car' ? '🚗' : '🔧'}
                  </Text>
                </View>
                <Text style={[
                  styles.categoryName,
                  selectedCategory?.id === category.id && styles.categoryNameSelected
                ]}>
                  {category.displayName}
                </Text>
                <Text style={[
                  styles.categoryPrice,
                  selectedCategory?.id === category.id && styles.categoryPriceSelected
                ]}>
                  R$ {category.basePrice.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Botão de Solicitar */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[
            styles.requestButton,
            (!selectedCategory || !originPlace || !destinationPlace) && styles.requestButtonDisabled
          ]}
          onPress={handleRequestService}
          disabled={!selectedCategory || !originPlace || !destinationPlace}
        >
          <LinearGradient
            colors={(!selectedCategory || !originPlace || !destinationPlace) 
              ? ['#E0E0E0', '#BDBDBD'] 
              : ['#4CAF50', '#45A049']
            }
            style={styles.requestButtonGradient}
          >
            <Text style={[
              styles.requestButtonText,
              (!selectedCategory || !originPlace || !destinationPlace) && styles.requestButtonTextDisabled
            ]}>
              {!selectedCategory ? 'Selecione uma categoria' :
               !originPlace ? 'Selecione a origem' :
               !destinationPlace ? 'Selecione o destino' :
               'Solicitar Serviço'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerLeft: {
    flex: 1,
  },
  userInfo: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: height * 0.35,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  originMarker: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  originText: {
    fontSize: 20,
  },
  destinationMarker: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  destinationText: {
    fontSize: 20,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  requestSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  inputsContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  inputHelper: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    minHeight: 50,
    fontWeight: '500',
  },
  inputLoader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  currentLocationIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  currentLocationText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  categoriesSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#F8F9FA',
    width: (width - 80) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryNameSelected: {
    color: '#2196F3',
  },
  categoryPrice: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryPriceSelected: {
    color: '#2196F3',
  },
  actionSection: {
    padding: 16,
  },
  requestButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  requestButtonDisabled: {
    elevation: 1,
    shadowOpacity: 0.1,
  },
  requestButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  requestButtonTextDisabled: {
    color: '#999',
  },
});