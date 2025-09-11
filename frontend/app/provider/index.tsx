import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

interface ServiceRequest {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  category: string;
  description: string;
  price: number;
  client_latitude: number;
  client_longitude: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

export default function ProviderHome() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { user, logout } = useAuth();
  const { socket, isConnected, sendMessage } = useSocket();

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  useEffect(() => {
    console.log('🚀 [PROVIDER] Iniciando ProviderHome...');
    fetchRequests();

    // Listen for new requests in real-time
    if (socket) {
      socket.on('new_request', (data) => {
        console.log('🔔 [PROVIDER] Nova solicitação via Socket:', data);
        fetchRequests(); // Refresh the list
      });
    }

    return () => {
      if (socket) {
        socket.off('new_request');
      }
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      console.log('🔄 [PROVIDER] Buscando solicitações...');
      const response = await axios.get(`${API_BASE_URL}/requests`);
      console.log('✅ [PROVIDER] Solicitações carregadas:', response.data.length);
      setRequests(response.data);
    } catch (error: any) {
      console.error('❌ [PROVIDER] Erro:', error);
      Alert.alert('Erro', 'Não foi possível carregar as solicitações');
    } finally {
      console.log('🏁 [PROVIDER] Finalizando carregamento...');
      setIsLoading(false);
    }
  };

  const handleRequestSelect = (request: ServiceRequest) => {
    console.log('🎯 Solicitação selecionada:', request.client_name);
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      console.log('✅ Aceitando solicitação...');
      await axios.put(`${API_BASE_URL}/requests/${selectedRequest.id}/accept`);
      
      Alert.alert(
        'Solicitação Aceita!',
        'O cliente foi notificado. Dirija-se ao local do serviço.',
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              fetchRequests();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erro ao aceitar:', error);
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao aceitar solicitação');
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      console.log('🎉 Concluindo serviço...');
      await axios.put(`${API_BASE_URL}/requests/${requestId}/complete`);
      Alert.alert('Serviço Concluído!', 'O cliente foi notificado');
      fetchRequests();
    } catch (error: any) {
      console.error('❌ Erro ao concluir:', error);
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao concluir serviço');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#2196F3';
      case 'in_progress': return '#4CAF50';
      case 'completed': return '#8BC34A';
      case 'cancelled': return '#F44336';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceita';
      case 'in_progress': return 'Em Progresso';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const renderRequest = ({ item }: { item: ServiceRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => handleRequestSelect(item)}
    >
      <View style={styles.requestHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <Text style={styles.serviceCategory}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#4CAF50" />
          <Text style={styles.detailText}>Ganho: R$ {item.price.toFixed(2)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>4km</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      
      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.description}
      </Text>

      {item.status === 'accepted' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompleteRequest(item.id)}
        >
          <Text style={styles.completeButtonText}>Concluir Serviço</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    console.log('🔄 [PROVIDER] Mostrando loading...');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando solicitações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🎯 [PROVIDER] Renderizando lista com', requests.length, 'solicitações');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Prestador - {user?.name}</Text>
          <View style={styles.connectionIndicator}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.connectionText}>
              {isConnected ? '🟢 Socket Conectado' : '🔴 Socket Desconectado'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchRequests} />}
      />

      {/* Modal de Detalhes */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Solicitação</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <>
                <View style={styles.modalClientInfo}>
                  <Text style={styles.modalClientName}>{selectedRequest.client_name}</Text>
                  <Text style={styles.modalClientPhone}>{selectedRequest.client_phone}</Text>
                  
                  <View style={styles.modalDetailsRow}>
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="construct" size={20} color="#007AFF" />
                      <Text style={styles.modalDetailText}>{selectedRequest.category}</Text>
                    </View>
                    
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="cash" size={20} color="#4CAF50" />
                      <Text style={styles.modalDetailText}>R$ {selectedRequest.price.toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="location" size={20} color="#666" />
                      <Text style={styles.modalDetailText}>4km</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Descrição do Serviço:</Text>
                  <Text style={styles.descriptionText}>{selectedRequest.description}</Text>
                </View>

                {selectedRequest.status === 'pending' && (
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.acceptButton]}
                      onPress={handleAcceptRequest}
                    >
                      <Text style={styles.acceptButtonText}>Aceitar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  requestDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalClientInfo: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  modalClientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClientPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    width: '100%',
  },
  modalDetailItem: {
    alignItems: 'center',
  },
  modalDetailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});