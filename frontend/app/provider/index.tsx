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
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

// 🔽 mapa estilo Uber
import CustomMapView, { LatLng } from '@/components/CustomMapView';
import CarMarker from '@/components/CarMarker';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface ServiceRequest {
  id: string;
  client_name: string;
  client_phone: string;
  category: string;
  description: string;
  price: number;
  distance?: number;
  client_address: string;
  status: string;
  client_latitude: number;
  client_longitude: number;
  created_at: string;
}

export default function ProviderScreen() {
  const { user, token, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);   // região inicial no mapa
  const [providerPos, setProviderPos] = useState<{ latitude: number; longitude: number; heading?: number } | null>(null); // posição animada do carro

  const [statusMessage, setStatusMessage] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [servicePhoto, setServicePhoto] = useState<string | null>(null);
  const [serviceDescription, setServiceDescription] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadRequests();
    getCurrentLocation();
    setupSocketListeners();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  // ===== localização do prestador: pega atual, envia pro backend e mantém watcher (move o carro)
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para funcionar corretamente.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const start = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setUserLocation({ ...start, latitudeDelta: 0.05, longitudeDelta: 0.05 } as any);
      setProviderPos({ ...start, heading: current.coords.heading ?? 0 });

      // envia localização inicial
      await axios.put(
        `${API_BASE_URL}/provider/location`,
        { latitude: start.latitude, longitude: start.longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // watcher para mover o carro suave no mapa e ir mandando pro backend
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1500,
          distanceInterval: 5,
        },
        async (loc) => {
          const next = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading ?? bearing(
              providerPos?.latitude ?? loc.coords.latitude,
              providerPos?.longitude ?? loc.coords.longitude,
              loc.coords.latitude,
              loc.coords.longitude
            ),
          };
          setProviderPos(next);

          try {
            await axios.put(
              `${API_BASE_URL}/provider/location`,
              { latitude: next.latitude, longitude: next.longitude },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (e) {
            // sem alarde: pode falhar offline
          }
        }
      );
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  // ===== sockets (notificações de novas solicitações/cancelamentos)
  const setupSocketListeners = () => {
    if (!socket) return;
    socket.on('new_request', (data) => {
      loadRequests();
      Alert.alert(
        '🔔 Nova Solicitação!',
        `Cliente: ${data.client_name}\nServiço: ${data.category}\nValor: R$ ${data.price}\nDistância: ${data.distance}km`,
        [{ text: 'OK' }]
      );
    });

    socket.on('request_cancelled', (data) => {
      loadRequests();
      if (activeRequest && activeRequest.id === data.request_id) {
        setActiveRequest(null);
        setShowMap(false);
        Alert.alert('Solicitação Cancelada', 'O cliente cancelou a solicitação.');
      }
    });
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const pendingRequests = response.data.filter((req: ServiceRequest) => req.status === 'pending');
      setRequests(pendingRequests);

      const activeReq = response.data.find((req: ServiceRequest) =>
        ['accepted', 'in_progress', 'near_client', 'started'].includes(req.status)
      );
      if (activeReq) {
        setActiveRequest(activeReq);
        updateStatusMessage(activeReq.status);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as solicitações');
    } finally {
      setLoading(false);
    }
  };

  const updateStatusMessage = (status: string) => {
    switch (status) {
      case 'accepted': setStatusMessage('📍 Dirija-se ao cliente'); break;
      case 'in_progress': setStatusMessage('🚗 A caminho do cliente'); break;
      case 'near_client': setStatusMessage('📍 Você chegou! Clique para iniciar o serviço'); break;
      case 'started': setStatusMessage('🔧 Serviço em andamento'); break;
      default: setStatusMessage(''); break;
    }
  };

  const handleRequestSelect = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;
    try {
      await axios.put(
        `${API_BASE_URL}/requests/${selectedRequest.id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveRequest(selectedRequest);
      setShowModal(false);
      setSelectedRequest(null);
      setShowMap(true);
      setStatusMessage('📍 Dirija-se ao cliente');
      setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
      Alert.alert('Sucesso', 'Solicitação aceita! Dirija-se ao cliente.');
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeRequest) return;
    try {
      await axios.put(
        `${API_BASE_URL}/requests/${activeRequest.id}/update-status`,
        { status: newStatus, message: getStatusMessage(newStatus) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
      updateStatusMessage(newStatus);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Prestador a caminho';
      case 'near_client': return 'Prestador chegou';
      case 'started': return 'Serviço iniciado';
      case 'completed': return 'Serviço concluído';
      default: return '';
    }
  };

  const handleStartService = () => {
    Alert.alert('Iniciar Serviço', 'Você chegou ao local do cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, iniciar', onPress: () => handleStatusUpdate('started') },
    ]);
  };

  const handleCompleteService = () => setShowServiceModal(true);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setServicePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleServiceComplete = async () => {
    if (!activeRequest) return;
    if (!servicePhoto) {
      Alert.alert('Foto obrigatória', 'Por favor, adicione uma foto do serviço concluído.');
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/requests/${activeRequest.id}/update-status`,
        { status: 'completed', photo_url: servicePhoto, message: serviceDescription || 'Serviço concluído' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Sucesso!', 'Serviço concluído com sucesso!');
      setActiveRequest(null);
      setShowMap(false);
      setShowServiceModal(false);
      setServicePhoto(null);
      setServiceDescription('');
      setStatusMessage('');
      loadRequests();
    } catch (error) {
      console.error('Erro ao concluir serviço:', error);
      Alert.alert('Erro', 'Não foi possível concluir o serviço');
    }
  };

  const renderRequest = ({ item }: { item: ServiceRequest }) => (
    <Animated.View style={[styles.requestCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={() => handleRequestSelect(item)}>
        <View style={styles.requestHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.client_name}</Text>
            <Text style={styles.serviceCategory}>{item.category}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Ganho</Text>
            <Text style={styles.priceValue}>R$ {item.price.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.distanceText}>{item.distance || '0'} km</Text>
          </View>

          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <Text style={styles.requestDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.clientAddress} numberOfLines={1}>📍 {item.client_address}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ===== Tela do mapa (serviço ativo) — agora com CustomMapView + CarMarker
  if (showMap && activeRequest) {
    const clientPoint: LatLng = {
      latitude: activeRequest.client_latitude,
      longitude: activeRequest.client_longitude,
    };

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

        <View style={styles.mapHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowMap(false)}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.mapTitle}>Serviço Ativo</Text>
          <TouchableOpacity style={styles.menuButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
         

        <CustomMapView
          style={styles.map}
          // origem = sua posição (prestador)
          origin={
            userLocation
              ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
              : undefined
          }
          // destino = posição do cliente
          destination={{
            latitude: activeRequest.client_latitude,
            longitude: activeRequest.client_longitude,
          }}
          initialRegion={
            userLocation
              ? {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
              : undefined
          }
          showsUserLocation
          showsMyLocationButton
          // callback opcional: seta um ETA inicial com base na rota
          onRouteReady={({ distanceKm, durationMin }) => {
            if (durationMin) {
              setStatusMessage(`📍 Dirija-se ao cliente — ~${durationMin} min`);
            }
          }}
        />

        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          <View style={styles.requestInfo}>
            <Text style={styles.clientName}>{activeRequest.client_name}</Text>
            <Text style={styles.serviceDetails}>
              {activeRequest.category} - R$ {activeRequest.price.toFixed(2)}
            </Text>
            <Text style={styles.clientPhone}>📞 {activeRequest.client_phone}</Text>
          </View>

          <View style={styles.actionButtons}>
            {activeRequest.status === 'accepted' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleStatusUpdate('in_progress')}>
                <Text style={styles.actionButtonText}>🚗 Estou a caminho</Text>
              </TouchableOpacity>
            )}
            {activeRequest.status === 'in_progress' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleStatusUpdate('near_client')}>
                <Text style={styles.actionButtonText}>📍 Cheguei no local</Text>
              </TouchableOpacity>
            )}
            {activeRequest.status === 'near_client' && (
              <TouchableOpacity style={styles.actionButton} onPress={handleStartService}>
                <Text style={styles.actionButtonText}>🔧 Iniciar Serviço</Text>
              </TouchableOpacity>
            )}
            {activeRequest.status === 'started' && (
              <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={handleCompleteService}>
                <Text style={styles.actionButtonText}>✅ Concluir Serviço</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Modal de conclusão */}
        <Modal visible={showServiceModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.serviceModal}>
              <Text style={styles.serviceModalTitle}>Concluir Serviço</Text>
              <Text style={styles.serviceModalSubtitle}>Adicione uma foto do trabalho realizado</Text>

              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                {servicePhoto ? (
                  <View style={styles.photoPreview}>
                    <Text style={styles.photoSelectedText}>✅ Foto selecionada</Text>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={40} color="#007AFF" />
                    <Text style={styles.photoPlaceholderText}>Adicionar Foto</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.descriptionInput}
                placeholder="Descrição do serviço realizado (opcional)"
                value={serviceDescription}
                onChangeText={setServiceDescription}
                multiline
                numberOfLines={3}
              />

              <View style={styles.serviceModalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowServiceModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.completeServiceButton, !servicePhoto && styles.disabledButton]}
                  onPress={handleServiceComplete}
                  disabled={!servicePhoto}
                >
                  <Text style={styles.completeServiceButtonText}>Concluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ===== Lista de solicitações
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name}! 🔧</Text>
          <Text style={styles.subtitle}>Solicitações disponíveis</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.socketStatus}>
            <View style={[styles.socketIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.socketText}>{isConnected ? 'Online' : 'Offline'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {activeRequest && (
        <TouchableOpacity style={styles.activeRequestBanner} onPress={() => setShowMap(true)}>
          <Ionicons name="construct-outline" size={20} color="#007AFF" />
          <Text style={styles.activeRequestText}>Serviço ativo - {activeRequest.client_name}</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando solicitações...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>Nenhuma solicitação disponível</Text>
          <Text style={styles.emptySubtitle}>Aguarde novas solicitações de clientes</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detalhes da solicitação */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalhes da Solicitação</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.clientSection}>
                    <Text style={styles.clientLabel}>Cliente</Text>
                    <Text style={styles.clientName}>{selectedRequest.client_name}</Text>
                    <Text style={styles.clientPhone}>📞 {selectedRequest.client_phone}</Text>
                  </View>

                  <View style={styles.serviceSection}>
                    <Text style={styles.serviceLabel}>Serviço</Text>
                    <Text style={styles.serviceName}>{selectedRequest.category}</Text>
                    <Text style={styles.serviceDescription}>{selectedRequest.description}</Text>
                  </View>

                  <View style={styles.detailsSection}>
                    <View style={styles.detailItem}>
                      <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                      <Text style={styles.detailLabel}>Ganho</Text>
                      <Text style={styles.detailValue}>R$ {selectedRequest.price.toFixed(2)}</Text>
                    </View>

                    <View className="detailItem">
                      <Ionicons name="location-outline" size={20} color="#666" />
                      <Text style={styles.detailLabel}>Distância</Text>
                      <Text style={styles.detailValue}>{selectedRequest.distance || '0'} km</Text>
                    </View>
                  </View>

                  <Text style={styles.addressLabel}>Endereço</Text>
                  <Text style={styles.addressText}>{selectedRequest.client_address}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.declineButton} onPress={() => setShowModal(false)}>
                    <Text style={styles.declineButtonText}>Recusar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRequest}>
                    <Text style={styles.acceptButtonText}>Aceitar Serviço</Text>
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

/** Bearing (graus) de A->B, para rotacionar o carro */
function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#E3F2FD', marginTop: 4 },
  headerActions: { alignItems: 'flex-end' },
  socketStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  socketIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  socketText: { fontSize: 12, color: '#E3F2FD' },
  logoutButton: { padding: 8 },

  activeRequestBanner: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  activeRequestText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#007AFF', fontWeight: '600' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },

  listContainer: { padding: 20 },
  requestCard: {
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
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  serviceCategory: { fontSize: 14, color: '#007AFF', fontWeight: '500', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 12, color: '#666' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  requestDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  distanceContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  distanceText: { fontSize: 14, color: '#666', marginLeft: 4 },
  timeContainer: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 14, color: '#666', marginLeft: 4 },
  requestDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 },
  clientAddress: { fontSize: 12, color: '#999', fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 20, margin: 20, maxHeight: height * 0.8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  modalContent: { paddingHorizontal: 20, paddingBottom: 20 },
  clientSection: { marginBottom: 16 },
  clientLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  clientPhone: { fontSize: 14, color: '#007AFF', marginTop: 4 },
  serviceSection: { marginBottom: 16 },
  serviceLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  serviceName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  serviceDescription: { fontSize: 14, color: '#666', marginTop: 4, lineHeight: 20 },
  detailsSection: { marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: '#666', marginLeft: 8, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  addressLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#1a1a1a', lineHeight: 20 },
  modalButtons: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20 },
  declineButton: { flex: 1, paddingVertical: 12, alignItems: 'center', marginRight: 8, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  declineButtonText: { fontSize: 16, color: '#666', fontWeight: '500' },
  acceptButton: { flex: 1, backgroundColor: '#4CAF50', paddingVertical: 12, alignItems: 'center', marginLeft: 8, borderRadius: 12 },
  acceptButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },

  mapHeader: { backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, marginRight: 16 },
  mapTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuButton: { padding: 8 },
  map: { flex: 1 },

  statusContainer: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  statusMessage: { fontSize: 16, fontWeight: '600', color: '#007AFF', textAlign: 'center', marginBottom: 12 },
  requestInfo: { alignItems: 'center', marginBottom: 16 },
  serviceDetails: { fontSize: 14, color: '#666', marginTop: 4 },

  actionButtons: { gap: 8 },
  actionButton: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  completeButton: { backgroundColor: '#4CAF50' },
  actionButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },

  serviceModal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, margin: 20, alignItems: 'center' },
  serviceModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  serviceModalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  photoButton: { width: '100%', marginBottom: 16 },
  photoPlaceholder: { borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 40, alignItems: 'center' },
  photoPlaceholderText: { fontSize: 16, color: '#007AFF', marginTop: 8 },
  photoPreview: { backgroundColor: '#E8F5E8', borderRadius: 12, paddingVertical: 20, alignItems: 'center' },
  photoSelectedText: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  descriptionInput: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 14, textAlignVertical: 'top', marginBottom: 20, minHeight: 80 },
  serviceModalButtons: { flexDirection: 'row', width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 12, alignItems: 'center', marginRight: 8, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  cancelButtonText: { fontSize: 16, color: '#666', fontWeight: '500' },
  completeServiceButton: { flex: 1, backgroundColor: '#4CAF50', paddingVertical: 12, alignItems: 'center', marginLeft: 8, borderRadius: 12 },
  disabledButton: { backgroundColor: '#ccc' },
  completeServiceButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});
