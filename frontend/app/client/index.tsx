import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert,
  ActivityIndicator, Animated, Dimensions, StatusBar, TextInput, Linking,
} from 'react-native';
import CustomMapView, { LatLng } from '@/components/CustomMapView';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

const { height } = Dimensions.get('window');
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
  phone?: string;
}

interface ServiceRequest {
  id: string;
  provider_id: string;
  status: string; // pending | accepted | in_progress | near_client | started | completed | cancelled
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

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Novo: modal simples para listar serviços em andamento
  const [showInProgressModal, setShowInProgressModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadProviders();
    getCurrentLocation();
    setupSocketListeners();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const onAccepted = (data: any) => {
      setCurrentRequest(prev => prev ? {
        ...prev,
        status: 'accepted',
        provider_latitude: data.provider_latitude ?? prev.provider_latitude,
        provider_longitude: data.provider_longitude ?? prev.provider_longitude,
        estimated_time: data.estimated_time ?? prev.estimated_time,
      } : prev);
      setStatusMessage('🎉 Solicitação aceita! O prestador está a caminho.');
    };

    const onProviderLoc = (data: any) => {
      setCurrentRequest(prev => {
        if (!prev || data.request_id !== prev.id) return prev;
        return {
          ...prev,
          provider_latitude: data.provider_latitude,
          provider_longitude: data.provider_longitude,
          estimated_time: data.estimated_time
        };
      });
      if (typeof data.estimated_time === 'number') {
        setStatusMessage(`🚗 Prestador chegando em ${data.estimated_time} min`);
      }
    };

    const onStatus = (data: any) => {
      setCurrentRequest(prev => {
        if (!prev || data.request_id !== prev.id) return prev;
        return { ...prev, status: data.status };
      });
      switch (data.status) {
        case 'near_client': setStatusMessage('📍 O prestador chegou!'); break;
        case 'started': setStatusMessage('🔧 Serviço iniciado.'); break;
        case 'completed':
          setStatusMessage('✅ Serviço concluído!');
          setShowRatingModal(true);
          break;
      }
    };

    socket.on('request_accepted', onAccepted);
    socket.on('provider_location_update', onProviderLoc);
    socket.on('status_updated', onStatus);

    return () => {
      socket.off('request_accepted', onAccepted);
      socket.off('provider_location_update', onProviderLoc);
      socket.off('status_updated', onStatus);
    };
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
      }, { headers: { Authorization: `Bearer ${token}` } });

      setCurrentRequest({
        id: response.data.id,
        provider_id: selectedProvider.user_id,
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
        rating,
        comment: ratingComment
      }, { headers: { Authorization: `Bearer ${token}` } });
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

  const renderProvider = ({ item }: { item: Provider }) => {
    const disabled = currentRequest?.provider_id === item.user_id && currentRequest.status !== 'completed';
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
              <Text style={styles.distanceText}>{item.distance} km</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.providerDescription} numberOfLines={2}>{item.description}</Text>
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

  // ======= TELA DE MAPA (opcional) =======
  if (showMap && currentRequest && userLocation) {
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
          showsUserLocation
          showsMyLocationButton
          onRouteReady={({ distanceKm, durationMin }) => {
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
        <Modal visible={showRatingModal} transparent animationType="slide" onRequestClose={() => setShowRatingModal(false)}>
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

  // ======= LISTA DE PRESTADORES =======
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

      {/* Botão simples para ver serviços em andamento */}
      <TouchableOpacity
        style={[styles.trackButton, !currentRequest && { opacity: 0.5 }]}
        onPress={() => setShowInProgressModal(true)}
        disabled={!currentRequest}
      >
        <Ionicons name="clipboard-outline" size={20} color="#fff" />
        <Text style={styles.trackButtonText}>Serviços em andamento</Text>
      </TouchableOpacity>

      {currentRequest && (
        <View style={styles.activeRequestBanner}>
          <Ionicons name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.activeRequestText}>{statusMessage || 'Você possui um serviço em andamento'}</Text>
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

      {/* Modal de confirmação do prestador */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
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
                      <Text style={styles.modalDetailText}>{selectedProvider.rating.toFixed(1)} estrelas</Text>
                    </View>
                  </View>

                  <Text style={styles.modalAddress}>{selectedProvider.address}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (requestLoading || (currentRequest && currentRequest.provider_id === selectedProvider.user_id && currentRequest.status !== 'completed')) && styles.confirmButtonDisabled
                    ]}
                    onPress={handleRequestService}
                    disabled={
                      requestLoading || (currentRequest && currentRequest.provider_id === selectedProvider.user_id && currentRequest.status !== 'completed')
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

      {/* Modal simples: Serviços em andamento */}
      <Modal
        visible={showInProgressModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInProgressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.inProgressModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Serviços em andamento</Text>
              <TouchableOpacity onPress={() => setShowInProgressModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {currentRequest ? (
              <View style={styles.inProgressCard}>
                <Text style={styles.inProgressTitle}>{currentRequest.category}</Text>
                <Text style={styles.inProgressProvider}>{currentRequest.provider_name}</Text>
                <Text style={styles.inProgressRow}>Status: <Text style={styles.inProgressStrong}>{currentRequest.status}</Text></Text>
                <Text style={styles.inProgressRow}>Preço: <Text style={styles.inProgressStrong}>R$ {currentRequest.price.toFixed(2)}</Text></Text>
                {typeof currentRequest.estimated_time === 'number' && (
                  <Text style={styles.inProgressRow}>ETA: <Text style={styles.inProgressStrong}>{currentRequest.estimated_time} min</Text></Text>
                )}

                <View style={styles.inProgressActions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setShowInProgressModal(false); setShowMap(true); }}>
                    <Ionicons name="map-outline" size={18} color="#007AFF" />
                    <Text style={styles.secondaryBtnText}>Abrir mapa</Text>
                  </TouchableOpacity>

                  {!!currentRequest.provider_phone && (
                    <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${currentRequest.provider_phone}`)}>
                      <Ionicons name="call-outline" size={18} color="#fff" />
                      <Text style={styles.callBtnText}>Ligar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <Text style={{ color: '#666', textAlign: 'center' }}>Você não possui serviços em andamento.</Text>
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 20, margin: 20, maxHeight: height * 0.8, width: '92%' },
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

  // Modal simples de "Serviços em andamento"
  inProgressModal: { backgroundColor: '#fff', borderRadius: 16, paddingBottom: 16, margin: 20, width: '92%' },
  inProgressCard: { paddingHorizontal: 20, paddingBottom: 16 },
  inProgressTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  inProgressProvider: { fontSize: 14, color: '#007AFF', marginTop: 2, marginBottom: 8 },
  inProgressRow: { fontSize: 14, color: '#555', marginTop: 4 },
  inProgressStrong: { fontWeight: '700', color: '#1a1a1a' },
  inProgressActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#007AFF',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
  },
  secondaryBtnText: { color: '#007AFF', fontWeight: '600', marginLeft: 6 },

  callBtn: { backgroundColor: '#34C759', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  callBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
});
