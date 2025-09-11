import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  TextInput,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Provider {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  rating: number;
  distance: number;
  user_id: string;
}

interface ServiceRequest {
  id: string;
  status: string;
  provider_name: string;
  provider_phone: string;
  category: string;
  price: number;
  estimated_time?: number;
  provider_latitude?: number;
  provider_longitude?: number;
}

export default function ClientScreen() {
  const { user, token, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadProviders();
    getCurrentLocation();
    setupSocketListeners();
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para encontrar prestadores próximos.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  const setupSocketListeners = () => {
    if (socket) {
      socket.on('request_accepted', (data) => {
        console.log('✅ Solicitação aceita:', data);
        setCurrentRequest(prev => prev ? { ...prev, status: 'accepted', ...data } : null);
        setStatusMessage('🎉 Solicitação aceita! O prestador está a caminho.');
        setShowMap(true);
        
        // Animate to show map
        if (mapRef.current && data.provider_latitude && data.provider_longitude) {
          mapRef.current.fitToCoordinates([
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: data.provider_latitude, longitude: data.provider_longitude }
          ], {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      });

      socket.on('provider_location_update', (data) => {
        console.log('📍 Localização do prestador atualizada:', data);
        if (currentRequest && data.request_id === currentRequest.id) {
          setCurrentRequest(prev => prev ? {
            ...prev,
            provider_latitude: data.provider_latitude,
            provider_longitude: data.provider_longitude,
            estimated_time: data.estimated_time
          } : null);
          
          setStatusMessage(`🚗 Prestador chegando em ${data.estimated_time} min (${data.distance} km)`);
        }
      });

      socket.on('status_updated', (data) => {
        console.log('📄 Status atualizado:', data);
        if (currentRequest && data.request_id === currentRequest.id) {
          setCurrentRequest(prev => prev ? { ...prev, status: data.status } : null);
          
          switch (data.status) {
            case 'near_client':
              setStatusMessage('📍 O prestador chegou! Ele está próximo.');
              break;
            case 'started':
              setStatusMessage('🔧 Serviço iniciado! O prestador está trabalhando.');
              break;
            case 'completed':
              setStatusMessage('✅ Serviço concluído!');
              setShowRatingModal(true);
              break;
          }
        }
      });
    }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data);
    } catch (error) {
      console.error('Erro ao carregar prestadores:', error);
      Alert.alert('Erro', 'Não foi possível carregar os prestadores');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowModal(true);
  };

  const handleRequestService = async () => {
    if (!selectedProvider || !userLocation) {
      Alert.alert('Erro', 'Selecione um prestador e permita acesso à localização');
      return;
    }

    setRequestLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/requests`, {
        provider_id: selectedProvider.user_id,
        category: selectedProvider.category,
        description: `Solicitação de serviço de ${selectedProvider.category}`,
        client_latitude: userLocation.latitude,
        client_longitude: userLocation.longitude,
        price: selectedProvider.price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentRequest({
        id: response.data.id,
        status: 'pending',
        provider_name: selectedProvider.name,
        provider_phone: selectedProvider.phone || '',
        category: selectedProvider.category,
        price: selectedProvider.price
      });

      setStatusMessage('⏳ Aguardando prestador aceitar...');
      setShowModal(false);
      setSelectedProvider(null);
      
      Alert.alert('Sucesso', 'Solicitação enviada! Aguarde a confirmação do prestador.');
      
    } catch (error) {
      console.error('Erro ao solicitar serviço:', error);
      Alert.alert('Erro', 'Não foi possível solicitar o serviço');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!currentRequest) return;

    try {
      await axios.post(`${API_BASE_URL}/ratings`, {
        request_id: currentRequest.id,
        rating: rating,
        comment: ratingComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Obrigado!', 'Sua avaliação foi enviada com sucesso!');
      setShowRatingModal(false);
      setCurrentRequest(null);
      setShowMap(false);
      setStatusMessage('');
      setRating(5);
      setRatingComment('');
      
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível enviar a avaliação');
    }
  };

  const renderProvider = ({ item }: { item: Provider }) => (
    <Animated.View style={[styles.providerCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={() => handleProviderSelect(item)}>
        <View style={styles.providerHeader}>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{item.name}</Text>
            <Text style={styles.providerCategory}>{item.category}</Text>
          </View>
          <View style={styles.providerStatus}>
            <View style={[styles.statusIndicator, { 
              backgroundColor: item.status === 'available' ? '#4CAF50' : '#FF9800' 
            }]} />
            <Text style={[styles.statusText, {
              color: item.status === 'available' ? '#4CAF50' : '#FF9800'
            }]}>
              {item.status === 'available' ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        
        <View style={styles.providerDetails}>
          <View style={styles.priceContainer}>
            <Ionicons name="cash-outline" size={16} color="#007AFF" />
            <Text style={styles.priceText}>R$ {item.price.toFixed(2)}</Text>
          </View>
          
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.distanceText}>{item.distance} km</Text>
          </View>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        
        <Text style={styles.providerDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        style={styles.starButton}
      >
        <Ionicons
          name={index < rating ? "star" : "star-outline"}
          size={30}
          color="#FFD700"
        />
      </TouchableOpacity>
    ));
  };

  if (showMap && currentRequest) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        
        <View style={styles.mapHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowMap(false)}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.mapTitle}>Acompanhar Serviço</Text>
          <TouchableOpacity style={styles.menuButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={userLocation}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
              }}
              title="Sua localização"
              pinColor="blue"
            />
          )}
          
          {currentRequest.provider_latitude && currentRequest.provider_longitude && (
            <>
              <Marker
                coordinate={{
                  latitude: currentRequest.provider_latitude,
                  longitude: currentRequest.provider_longitude
                }}
                title={currentRequest.provider_name}
                pinColor="red"
              />
              
              <Polyline
                coordinates={[
                  { latitude: userLocation.latitude, longitude: userLocation.longitude },
                  { latitude: currentRequest.provider_latitude, longitude: currentRequest.provider_longitude }
                ]}
                strokeColor="#007AFF"
                strokeWidth={3}
              />
            </>
          )}
        </MapView>

        <View style={styles.statusContainer}>
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          <View style={styles.requestInfo}>
            <Text style={styles.providerName}>{currentRequest.provider_name}</Text>
            <Text style={styles.serviceDetails}>
              {currentRequest.category} - R$ {currentRequest.price.toFixed(2)}
            </Text>
            {currentRequest.estimated_time && (
              <Text style={styles.estimatedTime}>
                Chegada em {currentRequest.estimated_time} minutos
              </Text>
            )}
          </View>
        </View>

        {/* Rating Modal */}
        <Modal visible={showRatingModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.ratingModal}>
              <Text style={styles.ratingTitle}>Avalie o Serviço</Text>
              <Text style={styles.ratingSubtitle}>Como foi sua experiência?</Text>
              
              <View style={styles.starsContainer}>
                {renderStars()}
              </View>
              
              <TextInput
                style={styles.commentInput}
                placeholder="Deixe um comentário (opcional)"
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.ratingButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowRatingModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Pular</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleRatingSubmit}
                >
                  <Text style={styles.submitButtonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name}! 👋</Text>
          <Text style={styles.subtitle}>Encontre o serviço que precisa</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.socketStatus}>
            <View style={[styles.socketIndicator, { 
              backgroundColor: isConnected ? '#4CAF50' : '#f44336' 
            }]} />
            <Text style={styles.socketText}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {currentRequest && (
        <View style={styles.activeRequestBanner}>
          <Ionicons name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.activeRequestText}>{statusMessage}</Text>
          <TouchableOpacity onPress={() => setShowMap(true)}>
            <Ionicons name="map-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando prestadores...</Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          renderItem={renderProvider}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Provider Selection Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedProvider && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedProvider.name}</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <Text style={styles.modalCategory}>{selectedProvider.category}</Text>
                  <Text style={styles.modalDescription}>{selectedProvider.description}</Text>
                  
                  <View style={styles.modalDetails}>
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="cash-outline" size={20} color="#007AFF" />
                      <Text style={styles.modalDetailText}>R$ {selectedProvider.price.toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="location-outline" size={20} color="#666" />
                      <Text style={styles.modalDetailText}>{selectedProvider.distance} km de distância</Text>
                    </View>
                    
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="star" size={20} color="#FFD700" />
                      <Text style={styles.modalDetailText}>
                        {selectedProvider.rating.toFixed(1)} estrelas
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.modalAddress}>{selectedProvider.address}</Text>
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.confirmButton, requestLoading && styles.confirmButtonDisabled]}
                    onPress={handleRequestService}
                    disabled={requestLoading}
                  >
                    {requestLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Solicitar Serviço</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  socketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  socketIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  socketText: {
    fontSize: 12,
    color: '#E3F2FD',
  },
  logoutButton: {
    padding: 8,
  },
  activeRequestBanner: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  activeRequestText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  providerCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  providerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  providerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  providerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalCategory: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalDetails: {
    marginBottom: 16,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  modalAddress: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  mapHeader: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  mapTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    alignItems: 'center',
  },
  serviceDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  estimatedTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  ratingModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  ratingButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});