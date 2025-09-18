import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Vibration,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useMatching } from '@/contexts/UberStyleMatchingContext';
import { useAuth } from '@/contexts/AuthContext';
import * as Location from 'expo-location';
import { API_URL } from '@/utils/config';
import { TrackingMapModal } from '@/components/TrackingMapModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { ServiceHistoryModal } from '@/components/ServiceHistoryModal';
import { BottomTabNavigation } from '@/components/BottomTabNavigation';
import { locationService } from '@/services/locationService';

const SERVICE_CATEGORIES = [
  { id: 'eletricista', name: 'Eletricista', icon: '⚡', color: '#FF6B35' },
  { id: 'encanador', name: 'Encanador', icon: '🔧', color: '#4A90E2' },
  { id: 'pintor', name: 'Pintor', icon: '🎨', color: '#F5A623' },
  { id: 'marceneiro', name: 'Marceneiro', icon: '🔨', color: '#8B4513' },
  { id: 'jardineiro', name: 'Jardineiro', icon: '🌱', color: '#7ED321' },
  { id: 'faxineiro', name: 'Faxineiro', icon: '✨', color: '#9013FE' },
  { id: 'mecanico', name: 'Mecânico', icon: '🚗', color: '#D0021B' },
  { id: 'reformas', name: 'Reformas', icon: '🏗️', color: '#50E3C2' },
];

export const UberStyleClient: React.FC = () => {
  const { user, validateToken, refreshAuth } = useAuth();
  const {
    currentRequest,
    assignedProvider,
    searchingProviders,
    requestService,
    cancelRequest,
    completeService,
    isConnected,
  } = useMatching();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    category: '',
    description: '',
    price: '',
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Estados para rastreamento
  const [showTrackingMap, setShowTrackingMap] = useState(false);

  // Estados para perfil
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Estados para histórico
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Estados para navegação
  const [activeTab, setActiveTab] = useState('home');

  // Função para iniciar busca por categoria
  const handleCategorySelect = async (category: typeof SERVICE_CATEGORIES[0]) => {
    if (!userLocation) {
      Alert.alert('Erro', 'Localização não disponível. Tente novamente.');
      return;
    }

    // Preencher dados do formulário automaticamente
    setRequestForm({
      category: category.name,
      description: `Preciso de um ${category.name.toLowerCase()}`,
      price: '',
    });

    // Iniciar busca diretamente
    try {
      await requestService({
        category: category.name,
        description: `Preciso de um ${category.name.toLowerCase()}`,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        address: userLocation.address || 'Localização atual',
        price: 50, // Preço base padrão
      });
    } catch (error) {
      console.error('Erro ao solicitar serviço:', error);
      Alert.alert('Erro', 'Não foi possível solicitar o serviço. Tente novamente.');
    }
  };

  // Obter localização atual e carregar prestadores
  useEffect(() => {
    getCurrentLocation();
    loadNearbyProviders(); // Carregar prestadores automaticamente
  }, []);

  // Carregar prestadores próximos
  const loadNearbyProviders = async () => {
    if (!user) return;

    try {
      console.log('🌐 [PROVIDER] Carregando prestadores próximos automaticamente...');

      const response = await fetch(`${API_URL}/providers?user_id=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const providers = await response.json();
        console.log('📊 [PROVIDER] Prestadores carregados:', providers.length);
        // Os prestadores serão mostrados no mapa automaticamente
      } else {
        console.error('❌ [PROVIDER] Erro ao carregar prestadores:', response.status);
      }
    } catch (error) {
      console.error('❌ [PROVIDER] Erro na requisição:', error);
    }
  };

  // Mostrar modal de avaliação quando serviço for concluído
  useEffect(() => {
    if (currentRequest?.status === 'completed' && user?.user_type === 2) {
      setShowRatingModal(true);
      showNotification('✅ Serviço Concluído!', 'Avalie o prestador para finalizar');
    }
  }, [currentRequest?.status, user?.user_type]);

  // Notificações para mudanças de status
  useEffect(() => {
    if (!currentRequest) return;

    switch (currentRequest.status) {
      case 'accepted':
        showNotification('🎉 Solicitação Aceita!', `${assignedProvider?.name} aceitou seu pedido`);
        Vibration.vibrate([0, 200, 100, 200]);
        break;
      case 'arrived':
        showNotification('📍 Prestador Chegou!', 'O prestador chegou ao local');
        Vibration.vibrate([0, 500]);
        break;
      case 'in_progress':
        showNotification('🔧 Serviço Iniciado', 'O prestador iniciou o trabalho');
        break;
      case 'completed':
        showNotification('✅ Serviço Concluído!', 'Avalie o prestador para finalizar');
        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
        break;
    }
  }, [currentRequest?.status, assignedProvider?.name]);

  const showNotification = async (title: string, body: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Imediato
      });
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao mostrar notificação:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para encontrar prestadores próximos.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address[0] ? `${address[0].street}, ${address[0].city}` : 'Endereço não encontrado',
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
  };

  const handleRequestService = async () => {
    if (!userLocation) {
      Alert.alert('Erro', 'Localização não disponível. Tente novamente.');
      return;
    }

    if (!requestForm.category || !requestForm.description || !requestForm.price) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const price = parseFloat(requestForm.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Preço inválido.');
      return;
    }

    await requestService({
      category: requestForm.category,
      description: requestForm.description,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      address: userLocation.address,
      price,
    });

    setShowRequestForm(false);
    setRequestForm({ category: '', description: '', price: '' });
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancelar solicitação',
      'Tem certeza que deseja cancelar?',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: cancelRequest },
      ]
    );
  };

  const handleCompleteService = async () => {
    await completeService(rating, ratingComment);
    setShowRatingModal(false);
    setRating(5);
    setRatingComment('');
  };

  const getStatusMessage = () => {
    if (!currentRequest) return '';

    switch (currentRequest.status) {
      case 'searching':
        return '🔍 Procurando prestador...';
      case 'offered':
        return '⏳ Prestador encontrado, aguardando confirmação...';
      case 'accepted':
        return `🚗 ${assignedProvider?.name || 'Prestador'} está a caminho`;
      case 'arrived':
        return `📍 ${assignedProvider?.name || 'Prestador'} chegou no local`;
      case 'in_progress':
        return '🔧 Serviço em andamento';
      case 'completed':
        return '✅ Serviço concluído';
      case 'cancelled':
        return '❌ Solicitação cancelada';
      case 'timeout':
        return '⏰ Nenhum prestador encontrado';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    if (!currentRequest) return '#666';

    switch (currentRequest.status) {
      case 'searching':
      case 'offered':
        return '#FF9500';
      case 'accepted':
      case 'arrived':
      case 'in_progress':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'cancelled':
      case 'timeout':
        return '#FF3B30';
      default:
        return '#666';
    }
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
     
      {currentRequest && (
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
          {searchingProviders && <ActivityIndicator color="white" style={styles.loader} />}
        </View>
      )}

      {/* Informações do prestador */}
      {assignedProvider && currentRequest && ['accepted', 'arrived', 'in_progress'].includes(currentRequest.status) && (
        <View style={styles.providerContainer}>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{assignedProvider.name}</Text>
            <Text style={styles.providerCategory}>{assignedProvider.category}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{assignedProvider.rating.toFixed(1)}</Text>
            </View>
          </View>
          {currentRequest.status === 'accepted' && (
            <Text style={styles.estimatedTime}>Chegada estimada: 10-15 min</Text>
          )}

          {/* Botão de Rastreamento */}
          {['accepted', 'arrived', 'in_progress'].includes(currentRequest.status) && (
            <TouchableOpacity
              style={styles.trackingButton}
              onPress={() => setShowTrackingMap(true)}
            >
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.trackingButtonText}>Ver no Mapa</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Interface Home quando não há solicitação ativa */}
      {!currentRequest && (
        <View style={styles.homeContainer}>
          {/* Header */}
          <View style={styles.homeHeader}>
            <View>
              <Text style={styles.greeting}>Olá, {user?.name || 'Cliente'}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.locationText}>
                  {userLocation?.address || 'Obtendo localização...'}
                </Text>
              </View>
              <Text style={styles.subtitle}>O que você precisa hoje?</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowProfileModal(true)}
            >
              <Ionicons name="person-circle" size={40} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Serviços Grid */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Serviços</Text>
            <Text style={styles.sectionSubtitle}>Encontre profissionais qualificados</Text>

            <View style={styles.servicesGrid}>
              {SERVICE_CATEGORIES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleCategorySelect(service)}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
                    <Text style={styles.serviceEmoji}>{service.icon}</Text>
                  </View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ações Rápidas */}
          <View style={styles.quickActionsSection}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setShowHistoryModal(true)}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
              </View>
              <Text style={styles.quickActionTitle}>Histórico</Text>
              <Text style={styles.quickActionSubtitle}>Ver serviços anteriores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setShowRequestForm(true)}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="add-circle" size={24} color="#34C759" />
              </View>
              <Text style={styles.quickActionTitle}>Novo Serviço</Text>
              <Text style={styles.quickActionSubtitle}>Solicitar agora</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Section */}
          <View style={styles.deliverySection}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <Text style={styles.sectionSubtitle}>Receba tudo em casa</Text>

            <View style={styles.deliveryGrid}>
              <TouchableOpacity
                style={[styles.deliveryCard, { backgroundColor: '#FFE5E5' }]}
                onPress={() => {
                  setRequestForm({ ...requestForm, category: 'Delivery - Restaurantes' });
                  setShowRequestForm(true);
                }}
              >
                <View style={[styles.deliveryIcon, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="restaurant" size={24} color="white" />
                </View>
                <Text style={styles.deliveryTitle}>Restaurantes</Text>
                <Text style={styles.deliverySubtitle}>Entrega de comida</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deliveryCard, { backgroundColor: '#E5F9E5' }]}
                onPress={() => {
                  setRequestForm({ ...requestForm, category: 'Delivery - Mercado' });
                  setShowRequestForm(true);
                }}
              >
                <View style={[styles.deliveryIcon, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="basket" size={24} color="white" />
                </View>
                <Text style={styles.deliveryTitle}>Mercado</Text>
                <Text style={styles.deliverySubtitle}>Compras de supermercado</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Botões de ação quando há solicitação ativa */}
      {currentRequest && ['searching', 'offered', 'accepted'].includes(currentRequest.status) && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRequest}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de solicitação */}
      <Modal visible={showRequestForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRequestForm(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Solicitar Serviço</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Categoria *</Text>
            <View style={styles.categoriesContainer}>
              {SERVICE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    requestForm.category === category.name && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setRequestForm({ ...requestForm, category: category.name })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      requestForm.category === category.name && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={styles.textInput}
              value={requestForm.description}
              onChangeText={(text) => setRequestForm({ ...requestForm, description: text })}
              placeholder="Descreva o serviço que precisa..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Preço (R$) *</Text>
            <TextInput
              style={styles.textInput}
              value={requestForm.price}
              onChangeText={(text) => setRequestForm({ ...requestForm, price: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />

            {userLocation && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.modalLocationText}>{userLocation.address}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleRequestService}
            >
              <Text style={styles.submitButtonText}>Solicitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de avaliação */}
      <Modal visible={showRatingModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 24 }} />
            <Text style={styles.modalTitle}>Avaliar Serviço</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Como foi o serviço?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Comentário (opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Deixe um comentário sobre o serviço..."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCompleteService}
            >
              <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Rastreamento */}
      {currentRequest && assignedProvider && (
        <TrackingMapModal
          visible={showTrackingMap}
          onClose={() => setShowTrackingMap(false)}
          requestId={currentRequest.id}
          providerId={assignedProvider.id}
          clientId={user?.id || ''}
          providerName={assignedProvider.name}
          clientName={user?.name || 'Cliente'}
          serviceDescription={currentRequest.description}
          initialProviderLocation={assignedProvider.latitude && assignedProvider.longitude ? {
            latitude: assignedProvider.latitude,
            longitude: assignedProvider.longitude,
            timestamp: Date.now(),
          } : undefined}
          initialClientLocation={userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            timestamp: Date.now(),
          } : undefined}
          isProvider={false}
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

      {/* Navegação Inferior */}
      <BottomTabNavigation
        activeTab={activeTab}
        tabs={[
          {
            id: 'home',
            label: 'Home',
            icon: '🏠',
            onPress: () => setActiveTab('home'),
          },
          {
            id: 'services',
            label: 'Serviços',
            icon: '🔧',
            onPress: () => setActiveTab('services'),
          },
          {
            id: 'activity',
            label: 'Atividade',
            icon: '📋',
            onPress: () => {
              setActiveTab('activity');
              setShowHistoryModal(true);
            },
          },
          {
            id: 'profile',
            label: 'Conta',
            icon: '👤',
            onPress: () => {
              setActiveTab('profile');
              setShowProfileModal(true);
            },
          },
        ]}
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
  providerContainer: {
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
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  providerCategory: {
    fontSize: 14,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  estimatedTime: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
  },
  requestButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos da Home
  homeContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileButton: {
    padding: 4,
  },
  servicesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceEmoji: {
    fontSize: 24,
    color: 'white',
  },
  serviceName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  deliverySection: {
    marginBottom: 32,
  },
  deliveryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  deliverySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  modalLocationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
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
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  debugButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
