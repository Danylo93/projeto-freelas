import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  Alert,
  Switch,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useMatching } from '@/contexts/UberStyleMatchingContext';
import CustomMapView from '../CustomMapView';
import { UberStyleMap } from '../map/UberStyleMap';
import { BottomSheet, BottomSheetContent } from './BottomSheet';
import { distanceService } from '../../services/distanceService';
import { useToast, InAppNotification } from './Toast';
import { LoadingAnimation } from './LoadingAnimation';
import { SmartLoadingAnimation } from './SmartLoadingAnimation';
import { analyticsService } from '../../services/analyticsService';
import { feedbackService } from '../../services/feedbackService';
import { cacheService } from '../../services/cacheService';
import { retryService } from '../../services/retryService';
import { useOptimizedLocation } from '../../hooks/useOptimizedLocation';
import { UserProfileModal } from '../UserProfileModal';
import { ServiceHistoryModal } from '../ServiceHistoryModal';
import { BottomTabNavigation } from '../BottomTabNavigation';
import { ProviderServicesModal } from './ProviderServicesModal';
import { ProviderStatusToggle } from '../provider/ProviderStatusToggle';
import { ProviderStatusUpdater } from './ProviderStatusUpdater';
import { TripInfoCard } from './TripInfoCard';
import * as Location from 'expo-location';
import axios from 'axios';

export const ModernProviderApp: React.FC = () => {
  const { user, token } = useAuth();
  const {
    currentRequest,
    searchingProviders,
    acceptRequest,
    rejectRequest,
    markArrived,
    startService,
    finishService,
    isConnected,
  } = useMatching();

  const [isOnline, setIsOnline] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  
  const [appState, setAppState] = useState<'offline' | 'online' | 'newRequest' | 'enRoute' | 'atLocation' | 'working' | 'completed'>('offline');
  const [earnings, setEarnings] = useState({ today: 0.00, week: 0.00 });
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showStatusUpdater, setShowStatusUpdater] = useState(false);
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [newRequestData, setNewRequestData] = useState<any>(null);

  const headerAnimation = useRef(new Animated.Value(0)).current;
  const statusAnimation = useRef(new Animated.Value(0)).current;
  const { showSuccess, showError, showInfo, ToastComponent } = useToast();

  useEffect(() => {
    getCurrentLocation();
    
    // Animações de entrada
    Animated.parallel([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(statusAnimation, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    if (!user || !token) return;

    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/requests?status=completed`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
        }
      );

      const completedServices = response.data.items || [];
      const today = new Date().toDateString();
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const todayEarnings = completedServices
        .filter((service: any) => new Date(service.completed_at || service.created_at).toDateString() === today)
        .reduce((sum: number, service: any) => sum + (service.price || 0), 0);

      const weekEarnings = completedServices
        .filter((service: any) => new Date(service.completed_at || service.created_at) >= thisWeekStart)
        .reduce((sum: number, service: any) => sum + (service.price || 0), 0);

      setEarnings({ today: todayEarnings, week: weekEarnings });
    } catch (error) {
      console.error('❌ [EARNINGS] Erro ao carregar ganhos:', error);
    }
  };

  useEffect(() => {
    // Atualizar estado baseado na solicitação atual
    if (currentRequest) {
      switch (currentRequest.status) {
        case 'offered':
          setAppState('newRequest');
          setShowNewRequestModal(true);
          break;
        case 'accepted':
          setAppState('enRoute');
          break;
        case 'arrived':
          setAppState('atLocation');
          break;
        case 'in_progress':
          setAppState('working');
          break;
        case 'completed':
          setAppState('completed');
          break;
        default:
          setAppState(isOnline ? 'online' : 'offline');
      }
    } else {
      setAppState(isOnline ? 'online' : 'offline');
    }
  }, [currentRequest, isOnline]);

  // Listener para eventos de nova solicitação
  useEffect(() => {
    const handleNewRequest = (data: any) => {
      console.log('🔔 [PROVIDER] Nova solicitação recebida:', data);

      if (user?.user_type === 1 && isOnline) {
        setNewRequestData(data);
        setAppState('newRequest');
        setShowNewRequestModal(true);

        // Mostrar toast de notificação
        showInfo(`Nova solicitação: ${data.category || 'Serviço'} - R$ ${data.price || 'N/A'}`);
      }
    };

    // Adicionar listener para eventos de nova solicitação
    const subscription = DeviceEventEmitter.addListener('new-request', handleNewRequest);

    return () => {
      subscription.remove();
    };
  }, [user, isOnline, showInfo]);

  const getCurrentLocation = async () => {
    try {
      await analyticsService.trackPerformance('get_location', async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          await feedbackService.error();
          Alert.alert('Permissão negada', 'Precisamos da sua localização para receber solicitações.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0]?.street || 'Localização atual',
        };

        setUserLocation(locationData);

        // Cache da localização
        await cacheService.cacheUserLocation(locationData);

        // Feedback de sucesso
        await feedbackService.locationFound();

        analyticsService.track('location_obtained', {
          method: 'provider_app',
          accuracy: location.coords.accuracy,
        });
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      await feedbackService.error();
      analyticsService.trackError(error, 'get_location_provider');
    }
  };

  const toggleOnlineStatus = () => {
    if (!isOnline && providerServices.length === 0) {
      Alert.alert(
        'Configure seus serviços',
        'Você precisa configurar pelo menos um serviço antes de ficar online.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: () => setShowServicesModal(true) },
        ]
      );
      return;
    }

    setIsOnline(!isOnline);
    if (!isOnline) {
      showSuccess('Você está online! Agora pode receber solicitações.');
    } else {
      showInfo('Você está offline. Não receberá novas solicitações.');
    }
  };

  const handleSaveServices = async (services: any[]) => {
    console.log('🔧 [DEBUG] Iniciando handleSaveServices');
    console.log('🔧 [DEBUG] Services recebidos:', services);
    console.log('🔧 [DEBUG] User:', user?.id);
    console.log('🔧 [DEBUG] UserLocation:', userLocation);
    console.log('🔧 [DEBUG] Token presente:', !!token);

    try {
      if (!user?.id) {
        throw new Error('ID do usuário não disponível');
      }

      if (!userLocation) {
        throw new Error('Localização não disponível');
      }

      if (!token) {
        throw new Error('Token de autenticação não disponível');
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('🔧 [DEBUG] API_URL:', API_URL);

      const configData = {
        user_id: user.id,
        services: services,
        location: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        is_available: true
      };

      console.log('🔧 [DEBUG] ConfigData:', JSON.stringify(configData, null, 2));

      const url = `${API_URL}/providers/services`;
      console.log('🔧 [DEBUG] URL completa:', url);

      console.log('🔧 [DEBUG] Tentando com AXIOS...');

      const response = await axios.post(url, configData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': '1',
        },
        timeout: 10000, // 10 segundos
      });

      console.log('🔧 [DEBUG] Axios concluído');
      console.log('🔧 [DEBUG] Response status:', response.status);
      console.log('🔧 [DEBUG] Response data:', response.data);

      setProviderServices(services);
      showSuccess(`${services.length} serviço(s) configurado(s) com sucesso!`);

      console.log('🔧 [DEBUG] handleSaveServices concluído com sucesso');
    } catch (error: any) {
      console.error('🔧 [DEBUG] Erro capturado:', error);
      console.error('🔧 [DEBUG] Erro tipo:', typeof error);
      console.error('🔧 [DEBUG] Erro message:', error.message);

      if (error.code === 'ECONNABORTED') {
        console.error('🔧 [DEBUG] Timeout do axios');
        throw new Error('Timeout: A requisição demorou muito para responder');
      } else if (error.response) {
        console.error('🔧 [DEBUG] Erro de resposta:', error.response.status, error.response.data);
        throw new Error(`HTTP ${error.response.status}: ${error.response.data}`);
      } else if (error.request) {
        console.error('🔧 [DEBUG] Erro de rede:', error.request);
        throw new Error('Erro de conexão: Verifique sua internet');
      } else {
        console.error('🔧 [DEBUG] Erro desconhecido:', error.stack);
        throw error;
      }
    }
  };

  const handleAcceptRequest = () => {
    const requestData = newRequestData || currentRequest;
    if (requestData) {
      const requestId = requestData.id || requestData.request_id;
      if (requestId) {
        acceptRequest(requestId);
        setShowNewRequestModal(false);
        setNewRequestData(null);
        showSuccess('Solicitação aceita! Indo ao local...');
      } else {
        console.error('❌ [PROVIDER] ID da solicitação não encontrado:', requestData);
        showError('Erro ao aceitar solicitação. Tente novamente.');
      }
    }
  };

  const handleRejectRequest = () => {
    const requestData = newRequestData || currentRequest;
    if (requestData) {
      const requestId = requestData.id || requestData.request_id;
      if (requestId) {
        rejectRequest(requestId);
        setShowNewRequestModal(false);
        setNewRequestData(null);
        showInfo('Solicitação recusada.');
      } else {
        console.error('❌ [PROVIDER] ID da solicitação não encontrado:', requestData);
        showError('Erro ao recusar solicitação. Tente novamente.');
      }
    }
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: headerAnimation,
          transform: [
            {
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Prestador'}</Text>
          <ProviderStatusToggle
            onStatusChange={(newStatus) => {
              setIsOnline(newStatus);
              setAppState(newStatus ? 'online' : 'offline');
            }}
          />
        </View>
        
        <View style={styles.headerActions}>
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>Hoje</Text>
            <Text style={styles.earningsValue}>R$ {earnings.today.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Ionicons name="person-circle" size={40} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Status card removido - layout simplificado

  const renderBottomSheetContent = () => {
    switch (appState) {
      case 'newRequest':
        const requestData = newRequestData || currentRequest;
        return (
          <BottomSheetContent
            title="🔔 Nova solicitação!"
            subtitle={`${requestData?.category || 'Serviço'} • R$ ${requestData?.price?.toFixed(2) || 'N/A'}`}
            actions={[
              {
                title: 'Aceitar',
                onPress: handleAcceptRequest,
                style: 'primary',
                icon: 'checkmark-circle',
              },
              {
                title: 'Recusar',
                onPress: handleRejectRequest,
                style: 'danger',
                icon: 'close-circle',
              },
            ]}
          >
            <View style={styles.requestDetails}>
              <View style={styles.clientInfo}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientInitial}>
                    {requestData?.client_name?.charAt(0) || 'C'}
                  </Text>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={styles.clientName}>
                    {requestData?.client_name || 'Cliente'}
                  </Text>
                  <Text style={styles.requestDescription}>
                    {requestData?.description || 'Serviço solicitado'}
                  </Text>
                  {requestData?.distance && (
                    <Text style={styles.distanceText}>
                      📍 {requestData.distance} km de distância
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <Text style={styles.locationText}>
                  {requestData?.client_address || userLocation?.address || 'Localização do cliente'}
                </Text>
              </View>

              {/* Informações adicionais */}
              <View style={styles.requestInfoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={16} color="#8E8E93" />
                  <Text style={styles.infoText}>
                    Solicitado há {new Date().toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cash" size={16} color="#34C759" />
                  <Text style={styles.infoText}>
                    Pagamento: {requestData?.payment_method || 'A combinar'}
                  </Text>
                </View>
              </View>
            </View>
          </BottomSheetContent>
        );

      case 'enRoute':
        return (
          <BottomSheetContent
            title="A caminho do cliente"
            subtitle="Navegue até o local do serviço"
            actions={[
              {
                title: 'Atualizar Status',
                onPress: () => setShowStatusUpdater(true),
                style: 'primary',
                icon: 'refresh',
              },
              {
                title: 'Ligar para o cliente',
                onPress: () => {},
                style: 'secondary',
                icon: 'call',
              },
            ]}
          >
            <View style={styles.serviceProgress}>
              <View style={styles.progressStep}>
                <View style={[styles.stepIndicator, styles.stepCompleted]}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.stepText}>Solicitação aceita</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={[styles.stepIndicator, styles.stepActive]}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <Text style={styles.stepText}>Indo ao local</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <Text style={styles.stepText}>Executar serviço</Text>
              </View>
            </View>
          </BottomSheetContent>
        );

      case 'atLocation':
        return (
          <BottomSheetContent
            title="Chegou no local!"
            subtitle="Inicie o serviço quando estiver pronto"
            actions={[
              {
                title: 'Atualizar Status',
                onPress: () => setShowStatusUpdater(true),
                style: 'primary',
                icon: 'refresh',
              },
            ]}
          />
        );

      case 'working':
        return (
          <BottomSheetContent
            title="Serviço em andamento"
            subtitle="Finalize quando o trabalho estiver concluído"
            actions={[
              {
                title: 'Atualizar Status',
                onPress: () => setShowStatusUpdater(true),
                style: 'primary',
                icon: 'refresh',
              },
            ]}
          />
        );

      case 'completed':
        return (
          <BottomSheetContent
            title="Serviço Finalizado!"
            subtitle="Parabéns! Você concluiu mais um serviço"
            actions={[
              {
                title: 'Voltar ao trabalho',
                onPress: () => {
                  setAppState(isOnline ? 'online' : 'offline');
                },
                style: 'primary',
                icon: 'checkmark-circle',
              },
            ]}
          >
            <View style={styles.completedContainer}>
              <View style={styles.completedIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#34C759" />
              </View>
              <Text style={styles.completedTitle}>Excelente trabalho!</Text>
              <Text style={styles.completedSubtitle}>
                O serviço foi finalizado com sucesso. Continue assim!
              </Text>

              {currentRequest && (
                <View style={styles.serviceDetails}>
                  <Text style={styles.serviceDetailsTitle}>Serviço realizado:</Text>
                  <Text style={styles.serviceDetailsText}>
                    {currentRequest.category} - R$ {currentRequest.price?.toFixed(2)}
                  </Text>
                  <Text style={styles.serviceDetailsText}>
                    {currentRequest.description}
                  </Text>
                </View>
              )}

              <View style={styles.earningsUpdate}>
                <Text style={styles.earningsText}>
                  + R$ {currentRequest?.price?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.earningsLabel}>Adicionado aos seus ganhos</Text>
              </View>
            </View>
          </BottomSheetContent>
        );

      default:
        return (
          <BottomSheetContent
            title={isOnline ? 'Aguardando solicitações...' : 'Você está offline'}
            subtitle={
              isOnline 
                ? 'Mantenha o app aberto para receber solicitações'
                : 'Ative o modo online para começar a trabalhar'
            }
          >
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>R$ {earnings.today.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Hoje</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>R$ {earnings.week.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Esta semana</Text>
              </View>
            </View>
          </BottomSheetContent>
        );
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.disconnectedContainer}>
        <Ionicons name="wifi-outline" size={48} color="#FF3B30" />
        <Text style={styles.disconnectedText}>Conectando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Mapa */}
      {currentRequest && userLocation ? (
        <UberStyleMap
          style={styles.map}
          clientLocation={{
            latitude: currentRequest.client_latitude,
            longitude: currentRequest.client_longitude,
          }}
          providerLocation={userLocation}
          showRoute={true}
          showDistanceInfo={true}
        />
      ) : (
        <CustomMapView
          style={styles.map}
          initialRegion={
            userLocation
              ? {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : undefined
          }
          showsUserLocation={true}
          showsMyLocationButton={false}
        />
      )}

      {/* Header */}
      {renderHeader()}

      {/* Status Card removido - agora está no BottomSheet */}

      {/* Bottom Sheet */}
      <BottomSheet
        snapPoints={[0.2, 0.45, 0.85]}
        initialSnap={0}
        showHandle={true}
      >
        {renderBottomSheetContent()}
      </BottomSheet>

      {/* Toast Notifications */}
      <ToastComponent />

      {/* Floating Action Button - Status Updater */}
      {currentRequest && ['accepted', 'arrived', 'in_progress'].includes(currentRequest.status) && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowStatusUpdater(true)}
        >
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* New Request Modal */}
      <InAppNotification
        visible={showNewRequestModal}
        title="Nova solicitação!"
        message={`${currentRequest?.category} • R$ ${currentRequest?.price?.toFixed(2) || '0.00'}\n${currentRequest?.description || ''}`}
        onAccept={handleAcceptRequest}
        onDecline={handleRejectRequest}
        acceptText="Aceitar"
        declineText="Recusar"
        type="request"
      />

      {/* Modals */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ServiceHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <ProviderServicesModal
        visible={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        onSave={handleSaveServices}
        initialServices={providerServices}
      />

      <ProviderStatusUpdater
        visible={showStatusUpdater}
        onClose={() => setShowStatusUpdater(false)}
      />

      {/* Bottom Tab Navigation */}
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
            onPress: () => {
              setActiveTab('services');
              setShowServicesModal(true);
            },
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
            id: 'account',
            label: 'Conta',
            icon: '👤',
            onPress: () => {
              setActiveTab('account');
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
    backgroundColor: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  disconnectedText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  profileButton: {
    padding: 4,
  },
  statusCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
    textAlign: 'left',
    flex: 1,
    lineHeight: 20,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  requestDetails: {
    paddingVertical: 20,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
    flex: 1,
  },
  serviceProgress: {
    paddingVertical: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCompleted: {
    backgroundColor: '#34C759',
  },
  stepActive: {
    backgroundColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  progressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5E7',
    marginLeft: 15,
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  configureButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  servicesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  servicesCount: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  editServicesText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  requestInfoCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  completedIcon: {
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  serviceDetails: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  serviceDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  serviceDetailsText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  earningsUpdate: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  earningsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 4,
  },
  earningsLabelBottom: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
