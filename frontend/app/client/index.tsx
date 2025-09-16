import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert,
  ActivityIndicator, Animated, Dimensions, StatusBar, TextInput,
} from 'react-native';
import CustomMapView, { LatLng } from '@/components/CustomMapView';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

import { PROVIDERS_API_URL, REQUESTS_API_URL } from '@/utils/config';
import { haversineDistance } from '@/utils/geo';

const { height } = Dimensions.get('window');

const PROVIDER_SERVICE_CONFIG_ERROR =
  'Serviço de prestadores indisponível. Configure EXPO_PUBLIC_PROVIDER_SERVICE_URL ou o gateway com /api/providers.';

const REQUEST_SERVICE_CONFIG_ERROR =
  'Serviço de solicitações indisponível. Configure EXPO_PUBLIC_REQUEST_SERVICE_URL ou o gateway com /api/requests.';

interface Provider {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  rating: number;
  user_id: string;
  phone?: string;
}

interface ServiceRequest {
  id: string;
  provider_id: string;
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

  const [userLocation, setUserLocation] = useState<LatLng | null>(null); // cliente = destino
  const [statusMessage, setStatusMessage] = useState('');

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const providerConfigAlertShown = useRef(false);
  const requestConfigAlertShown = useRef(false);

  useEffect(() => {
    loadProviders();
    getCurrentLocation();
    setupSocketListeners();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para encontrar prestadores próximos.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('request_accepted', (data) => {
      // data: { request_id, provider_name, provider_phone, provider_latitude, provider_longitude, ... }
      setCurrentRequest(prev => prev ? {
        ...prev,
        status: 'accepted',
        provider_latitude: data.provider_latitude ?? prev.provider_latitude,
        provider_longitude: data.provider_longitude ?? prev.provider_longitude,
        estimated_time: data.estimated_time ?? prev.estimated_time,
      } : null);
      setStatusMessage('🎉 Solicitação aceita! O prestador está a caminho.');
      setShowMap(true);
    });

    socket.on('provider_location_update', (data) => {
      // data: { request_id, provider_latitude, provider_longitude, distance, estimated_time }
      if (!currentRequest || data.request_id !== currentRequest.id) return;
      setCurrentRequest(prev => prev ? {
        ...prev,
        provider_latitude: data.provider_latitude,
        provider_longitude: data.provider_longitude,
        estimated_time: data.estimated_time
      } : null);
      setStatusMessage(`🚗 Prestador chegando em ${data.estimated_time} min (${data.distance} km)`);
    });

    socket.on('status_updated', (data) => {
      if (!currentRequest || data.request_id !== currentRequest.id) return;
      setCurrentRequest(prev => prev ? { ...prev, status: data.status } : null);
      switch (data.status) {
        case 'near_client': setStatusMessage('📍 O prestador chegou!'); break;
        case 'started': setStatusMessage('🔧 Serviço iniciado.'); break;
        case 'completed':
          setStatusMessage('✅ Serviço concluído!');
          setShowRatingModal(true);
          break;
      }
    });
  };

  const loadProviders = async () => {
    if (!PROVIDERS_API_URL) {
      if (!providerConfigAlertShown.current) {
        Alert.alert('Configuração necessária', PROVIDER_SERVICE_CONFIG_ERROR);
        providerConfigAlertShown.current = true;
      }
      setLoading(false);
      setProviders([]);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(PROVIDERS_API_URL, {
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

  const generateRequestId = () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleRequestService = async () => {
    if (!selectedProvider || !userLocation || !user) {
      Alert.alert('Erro', 'Selecione um prestador e permita acesso à localização');
      return;
    }
    if (!REQUESTS_API_URL) {
      if (!requestConfigAlertShown.current) {
        Alert.alert('Configuração necessária', REQUEST_SERVICE_CONFIG_ERROR);
        requestConfigAlertShown.current = true;
      }
      return;
    }
    setRequestLoading(true);
    const requestId = generateRequestId();
    try {
      const payload = {
        id: requestId,
        client_id: user.id,
        provider_id: selectedProvider.id,
        category: selectedProvider.category,
        description: `Solicitação de serviço de ${selectedProvider.category}`,
        client_latitude: userLocation.latitude,
        client_longitude: userLocation.longitude,
        price: selectedProvider.price,
        status: 'pending' as const,
      };

      const response = await axios.post(REQUESTS_API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const createdId = response.data.id ?? requestId;

      setCurrentRequest({
        id: createdId,
        provider_id: selectedProvider.id,
        status: response.data.status ?? 'pending',
        provider_name: selectedProvider.name,
        provider_phone: selectedProvider.phone || '',
        category: selectedProvider.category,
        price: selectedProvider.price,
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

  const handleRatingSubmit = () => {
    if (!currentRequest) return;
    Alert.alert('Obrigado!', 'Sua avaliação foi registrada!');
    setShowRatingModal(false);
    setCurrentRequest(null);
    setShowMap(false);
    setStatusMessage('');
    setRating(5);
    setRatingComment('');
  };

  const renderProvider = ({ item }: { item: Provider }) => {
    const distanceKm = userLocation
      ? haversineDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
      : null;
    const disabled = currentRequest?.provider_id === item.id && currentRequest.status !== 'completed';
    const distanceText = distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—';
    return (
      <Animated.View style={[styles.providerCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity onPress={() => handleProviderSelect(item)} disabled={disabled} style={disabled ? styles.disabledProvider : undefined}>
          <View style={styles.providerHeader}>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{item.name}</Text>
              <Text style={styles.providerCategory}>{item.category}</Text>
            </View>
            <View style={styles.providerStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: item.status === 'available' ? '#4CAF50' : '#FF9800' }]} />
              <Text style={[styles.statusText, { color: item.status === 'available' ? '#4CAF50' : '#FF9800' }]}>
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
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.providerDescription} numberOfLines={2}>{item.description || "Sem descrição disponível."}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderStars = () =>
    Array.from({ length: 5 }, (_, i) => (
      <TouchableOpacity key={i} onPress={() => setRating(i + 1)} style={styles.starButton}>
        <Ionicons name={i < rating ? 'star' : 'star-outline'} size={30} color="#FFD700" />
      </TouchableOpacity>
    ));

  // ==== TELA DE TRACKING (mapa) ====
  if (showMap && currentRequest && userLocation) {
    // origem = prestador (se já temos posição dele); destino = cliente (você)
    const providerPoint = (currentRequest.provider_latitude && currentRequest.provider_longitude)
      ? { latitude: currentRequest.provider_latitude, longitude: currentRequest.provider_longitude }
      : undefined;

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

        <CustomMapView
          style={styles.map}
          origin={providerPoint}
          destination={userLocation}
          initialRegion={{ latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRouteReady={({ distanceKm, durationMin }) => {
            // fallback de ETA quando ainda não há provider_location_update
            if (!currentRequest?.estimated_time && durationMin) {
              setCurrentRequest(prev => prev ? { ...prev, estimated_time: durationMin } : prev);
            }
          }}
        />

        <View style={styles.statusContainer}>
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          <View style={styles.requestInfo}>
            <Text style={styles.providerName}>{currentRequest.provider_name}</Text>
            <Text style={styles.serviceDetails}>
              {currentRequest.category} - R$ {currentRequest.price.toFixed(2)}
            </Text>
            {currentRequest.estimated_time != null && (
              <Text style={styles.estimatedTime}>Chegada em {currentRequest.estimated_time} minutos</Text>
            )}
          </View>
        </View>

        {/* Avaliação */}
        <Modal visible={showRatingModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.ratingModal}>
              <Text style={styles.ratingTitle}>Avalie o Serviço</Text>
              <Text style={styles.ratingSubtitle}>Como foi sua experiência?</Text>
              <View style={styles.starsContainer}>{renderStars()}</View>
              <TextInput
                style={styles.commentInput}
                placeholder="Deixe um comentário (opcional)"
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline numberOfLines={3}
              />
              <View style={styles.ratingButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRatingModal(false)}>
                  <Text style={styles.cancelButtonText}>Pular</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleRatingSubmit}>
                  <Text style={styles.submitButtonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ==== LISTA DE PRESTADORES ====
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
            <View style={[styles.socketIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.socketText}>{isConnected ? 'Conectado' : 'Desconectado'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {currentRequest && (
        <>
          <View style={styles.activeRequestBanner}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.activeRequestText}>{statusMessage}</Text>
          </View>
          <TouchableOpacity style={styles.trackButton} onPress={() => setShowMap(true)}>
            <Ionicons name="map-outline" size={20} color="#fff" />
            <Text style={styles.trackButtonText}>Acompanhar pedido</Text>
          </TouchableOpacity>
        </>
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

      {/* Modal de confirmação do prestador */}
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
                      <Text style={styles.modalDetailText}>{userLocation ? `${haversineDistance(userLocation.latitude, userLocation.longitude, selectedProvider.latitude, selectedProvider.longitude).toFixed(1)} km de distância` : 'Distância indisponível'}</Text>
                    </View>
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="star" size={20} color="#FFD700" />
                      <Text style={styles.modalDetailText}>{selectedProvider.rating.toFixed(1)} estrelas</Text>
                    </View>
                  </View>

                  <Text style={styles.modalAddress}>Lat: {selectedProvider.latitude.toFixed(4)} | Lon: {selectedProvider.longitude.toFixed(4)}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (requestLoading || (currentRequest && currentRequest.provider_id === selectedProvider.id && currentRequest.status !== 'completed')) && styles.confirmButtonDisabled
                    ]}
                    onPress={handleRequestService}
                    disabled={
                      requestLoading || (currentRequest && currentRequest.provider_id === selectedProvider.id && currentRequest.status !== 'completed')
                    }
                  >
                    {requestLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Solicitar Serviço</Text>}
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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#007AFF', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#E3F2FD', marginTop: 4 },
  headerActions: { alignItems: 'flex-end' },
  socketStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  socketIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  socketText: { fontSize: 12, color: '#E3F2FD' },
  logoutButton: { padding: 8 },

  activeRequestBanner: {
    backgroundColor: '#E3F2FD', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd',
  },
  activeRequestText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#007AFF', fontWeight: '500' },
  trackButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#007AFF', marginHorizontal: 20, marginVertical: 12, paddingVertical: 12, borderRadius: 12,
  },
  trackButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },

  listContainer: { padding: 20 },
  providerCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  providerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  providerCategory: { fontSize: 14, color: '#007AFF', fontWeight: '500', marginTop: 2 },
  providerStatus: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  providerDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  priceText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginLeft: 4 },
  distanceContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  distanceText: { fontSize: 14, color: '#666', marginLeft: 4 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 14, color: '#666', marginLeft: 4 },
  providerDescription: { fontSize: 14, color: '#666', lineHeight: 20 },
  disabledProvider: { opacity: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 20, margin: 20, maxHeight: height * 0.8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  modalContent: { paddingHorizontal: 20, paddingBottom: 20 },
  modalCategory: { fontSize: 16, color: '#007AFF', fontWeight: '600', marginBottom: 8 },
  modalDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  modalDetails: { marginBottom: 16 },
  modalDetailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  modalDetailText: { fontSize: 14, color: '#1a1a1a', marginLeft: 8 },
  modalAddress: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  modalButtons: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20 },
  cancelButton: { flex: 1, paddingVertical: 12, alignItems: 'center', marginRight: 8, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  cancelButtonText: { fontSize: 16, color: '#666', fontWeight: '500' },
  confirmButton: { flex: 1, backgroundColor: '#007AFF', paddingVertical: 12, alignItems: 'center', marginLeft: 8, borderRadius: 12 },
  confirmButtonDisabled: { backgroundColor: '#ccc' },
  confirmButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },

  mapHeader: { backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, marginRight: 16 },
  mapTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuButton: { padding: 8 },
  map: { flex: 1 },

  statusContainer: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  statusMessage: { fontSize: 16, fontWeight: '600', color: '#007AFF', textAlign: 'center', marginBottom: 12 },
  requestInfo: { alignItems: 'center' },
  serviceDetails: { fontSize: 14, color: '#666', marginTop: 4 },
  estimatedTime: { fontSize: 12, color: '#999', marginTop: 4 },

  ratingModal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, margin: 20, alignItems: 'center' },
  ratingTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  ratingSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', marginBottom: 20 },
  starButton: { padding: 4, marginHorizontal: 4 },
  commentInput: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, fontSize: 14, textAlignVertical: 'top', marginBottom: 20 },
  ratingButtons: { flexDirection: 'row', width: '100%' },
  submitButton: { flex: 1, backgroundColor: '#007AFF', paddingVertical: 12, alignItems: 'center', marginLeft: 8, borderRadius: 12 },
  submitButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});
