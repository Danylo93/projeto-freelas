import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMatching } from '@/contexts/UberStyleMatchingContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { TrackingMapModal } from '@/components/TrackingMapModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { ServiceHistoryModal } from '@/components/ServiceHistoryModal';
import { locationService } from '@/services/locationService';

export const UberStyleProvider: React.FC = () => {
  const { user } = useAuth();
  const {
    currentRequest,
    searchingProviders,
    acceptRequest,
    rejectRequest,
    updateLocation,
    markArrived,
    startService,
    finishService,
    isConnected,
  } = useMatching();

  const [isOnline, setIsOnline] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Estados para rastreamento
  const [showTrackingMap, setShowTrackingMap] = useState(false);

  // Estados para perfil
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Estados para histórico
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Obter localização atual
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Atualizar localização periodicamente quando online e com solicitação ativa
  useEffect(() => {
    if (isOnline && currentRequest && ['accepted', 'arrived', 'in_progress'].includes(currentRequest.status)) {
      startLocationUpdates();
    } else {
      stopLocationUpdates();
    }

    return stopLocationUpdates;
  }, [isOnline, currentRequest]);

  // Listener para novas solicitações (simulado - em produção viria do WebSocket)
  useEffect(() => {
    if (!isOnline || !isConnected) return;

    // Remover mock - agora usa notificações reais do Socket.IO
  }, [isOnline, isConnected, currentRequest]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para receber solicitações.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
  };

  const startLocationUpdates = () => {
    if (locationIntervalRef.current) return;

    locationIntervalRef.current = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(newLocation);
        await updateLocation(newLocation.latitude, newLocation.longitude);
      } catch (error) {
        console.error('Erro ao atualizar localização:', error);
      }
    }, 10000); // Atualizar a cada 10 segundos
  };

  const stopLocationUpdates = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const handleToggleOnline = () => {
    if (!userLocation) {
      Alert.alert('Erro', 'Localização não disponível. Tente novamente.');
      return;
    }

    setIsOnline(!isOnline);
    
    if (!isOnline) {
      Alert.alert('✅ Online', 'Você está online e pode receber solicitações!');
    } else {
      Alert.alert('⏸️ Offline', 'Você não receberá mais solicitações.');
    }
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    
    await acceptRequest(incomingRequest.id);
    setShowRequestModal(false);
    setIncomingRequest(null);
  };

  const handleRejectRequest = async () => {
    if (!incomingRequest) return;
    
    await rejectRequest(incomingRequest.id);
    setShowRequestModal(false);
    setIncomingRequest(null);
  };

  const handleMarkArrived = () => {
    Alert.alert(
      'Confirmar chegada',
      'Você chegou no local do cliente?',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: markArrived },
      ]
    );
  };

  const handleStartService = () => {
    Alert.alert(
      'Iniciar serviço',
      'Confirma o início do serviço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar', onPress: startService },
      ]
    );
  };

  const handleFinishService = () => {
    Alert.alert(
      'Finalizar serviço',
      'Confirma a finalização do serviço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', onPress: finishService },
      ]
    );
  };

  const getStatusMessage = () => {
    if (!currentRequest) {
      return isOnline ? '🟢 Online - Aguardando solicitações' : '🔴 Offline';
    }

    switch (currentRequest.status) {
      case 'pending':
        return '⏳ Nova solicitação disponível';
      case 'offered':
        return '⏳ Nova solicitação recebida';
      case 'accepted':
        return '🚗 Indo para o cliente';
      case 'in_progress':
        return '🚗 A caminho do cliente';
      case 'near_client':
        return '📍 Chegou no local - Aguardando início';
      case 'started':
        return '🔧 Serviço em andamento';
      case 'completed':
        return '✅ Serviço concluído';
      default:
        return `📋 Status: ${currentRequest.status}`;
    }
  };

  const getStatusColor = () => {
    if (!currentRequest) {
      return isOnline ? '#34C759' : '#8E8E93';
    }

    switch (currentRequest.status) {
      case 'pending':
      case 'offered':
        return '#FF9500';
      case 'accepted':
      case 'in_progress':
      case 'near_client':
      case 'started':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Ionicons name="wifi-outline" size={48} color="#FF3B30" />
          <Text style={styles.disconnectedText}>Conectando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header do Prestador */}
      <View style={styles.providerHeader}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name || 'Prestador'}</Text>
          <Text style={styles.subtitle}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setShowHistoryModal(true)}
          >
            <Ionicons name="document-text" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Ionicons name="person-circle" size={40} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status atual */}
      <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusMessage()}</Text>
        {searchingProviders && <ActivityIndicator color="white" style={styles.loader} />}
      </View>

      {/* Informações da solicitação atual */}
      {currentRequest && (
        <View style={styles.requestContainer}>
          <View style={styles.requestHeader}>
            <Text style={styles.requestTitle}>Solicitação Atual</Text>
            <Text style={styles.requestPrice}>R$ {currentRequest.price.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.requestCategory}>{currentRequest.category}</Text>
          <Text style={styles.requestDescription}>{currentRequest.description}</Text>
          <Text style={styles.requestAddress}>{currentRequest.client_address}</Text>
          
          {userLocation && (
            <Text style={styles.requestDistance}>
              Distância: {calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                currentRequest.client_latitude,
                currentRequest.client_longitude
              ).toFixed(1)} km
            </Text>
          )}
        </View>
      )}

      {/* Botões de ação */}
      <View style={styles.actionsContainer}>
        {!currentRequest && (
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: isOnline ? '#FF3B30' : '#34C759' }]}
            onPress={handleToggleOnline}
          >
            <Ionicons
              name={isOnline ? "pause" : "play"}
              size={24}
              color="white"
            />
            <Text style={styles.toggleButtonText}>
              {isOnline ? 'Ficar Offline' : 'Ficar Online'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botões para solicitação pendente */}
        {(currentRequest?.status === 'pending' || currentRequest?.status === 'offered') && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#34C759' }]}
              onPress={acceptRequest}
            >
              <Text style={styles.actionButtonText}>✅ Aceitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={rejectRequest}
            >
              <Text style={styles.actionButtonText}>❌ Recusar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botões para solicitação aceita */}
        {currentRequest?.status === 'accepted' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={markArrived}
          >
            <Text style={styles.actionButtonText}>🚗 Estou a caminho</Text>
          </TouchableOpacity>
        )}

        {(currentRequest?.status === 'in_progress') && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={markArrived}
          >
            <Text style={styles.actionButtonText}>📍 Cheguei no local</Text>
          </TouchableOpacity>
        )}

        {currentRequest?.status === 'near_client' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={startService}
          >
            <Text style={styles.actionButtonText}>🔧 Iniciar Serviço</Text>
          </TouchableOpacity>
        )}

        {currentRequest?.status === 'started' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#34C759' }]}
            onPress={finishService}
          >
            <Text style={styles.actionButtonText}>✅ Finalizar Serviço</Text>
          </TouchableOpacity>
        )}

        {/* Botão de Rastreamento */}
        {currentRequest && ['accepted', 'arrived', 'in_progress'].includes(currentRequest.status) && (
          <TouchableOpacity
            style={styles.trackingButton}
            onPress={() => setShowTrackingMap(true)}
          >
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.trackingButtonText}>Compartilhar Localização</Text>
          </TouchableOpacity>
        )}

        {/* Botão para ver detalhes/navegar para service-flow */}
        {currentRequest && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF', marginTop: 10 }]}
            onPress={() => {
              console.log('🗺️ [PROVIDER] Navegando para service-flow...');
              router.push('/service-flow');
            }}
          >
            <Text style={styles.actionButtonText}>🗺️ Ver Detalhes no Mapa</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de nova solicitação */}
      <Modal visible={showRequestModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔔 Nova Solicitação!</Text>
          </View>

          {incomingRequest && (
            <View style={styles.modalContent}>
              <View style={styles.requestInfo}>
                <Text style={styles.modalRequestPrice}>R$ {incomingRequest.price?.toFixed(2)}</Text>
                <Text style={styles.modalRequestCategory}>{incomingRequest.category}</Text>
                <Text style={styles.modalRequestDescription}>{incomingRequest.description}</Text>
                <Text style={styles.modalRequestAddress}>{incomingRequest.client_address}</Text>
                
                {userLocation && (
                  <Text style={styles.modalRequestDistance}>
                    Distância: {calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      incomingRequest.client_latitude,
                      incomingRequest.client_longitude
                    ).toFixed(1)} km
                  </Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={handleRejectRequest}
                >
                  <Text style={styles.rejectButtonText}>Recusar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={handleAcceptRequest}
                >
                  <Text style={styles.acceptButtonText}>Aceitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal de Rastreamento */}
      {currentRequest && (
        <TrackingMapModal
          visible={showTrackingMap}
          onClose={() => setShowTrackingMap(false)}
          requestId={currentRequest.id}
          providerId={user?.id || ''}
          clientId={currentRequest.client_id || ''}
          providerName={user?.name || 'Prestador'}
          clientName={'Cliente'}
          serviceDescription={currentRequest.description}
          initialProviderLocation={userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            timestamp: Date.now(),
          } : undefined}
          initialClientLocation={undefined}
          isProvider={true}
        />
      )}

      {/* Modal de Perfil */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Modal de Histórico */}
      <ServiceHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectedText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  statusContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginLeft: 12,
  },
  requestContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  requestPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
  },
  requestCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requestAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestDistance: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  requestInfo: {
    flex: 1,
  },
  modalRequestPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalRequestCategory: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 8,
  },
  modalRequestDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  modalRequestAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalRequestDistance: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F3FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  trackingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  profileButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
  },
});

export default UberStyleProvider;
