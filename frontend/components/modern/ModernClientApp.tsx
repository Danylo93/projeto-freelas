import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useMatching } from '@/contexts/UberStyleMatchingContext';
import CustomMapView from '../CustomMapView';
import { UberStyleMap } from '../map/UberStyleMap';
import { BottomSheet, BottomSheetContent } from './BottomSheet';
import { distanceService } from '../../services/distanceService';
import { ServiceGrid, FeaturedService } from './ServiceCard';
import { TripInfoCard } from './TripInfoCard';
import { useToast } from './Toast';
import { LoadingAnimation } from './LoadingAnimation';
import { SmartLoadingAnimation } from './SmartLoadingAnimation';
import { analyticsService } from '../../services/analyticsService';
import { feedbackService } from '../../services/feedbackService';
import { cacheService } from '../../services/cacheService';
import { retryService } from '../../services/retryService';
import { UserProfileModal } from '../UserProfileModal';
import { ClientHistoryModal } from './ClientHistoryModal';
import { BottomTabNavigation } from '../BottomTabNavigation';
import { PriceOfferModal } from './PriceOfferModal';
import { ClientProgressTracker } from './ClientProgressTracker';
import { InteractiveFeedback } from './InteractiveFeedback';
import { PaymentCheckoutModal } from '../PaymentCheckoutModal';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://192.168.100.8:8000';

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

export const ModernClientApp: React.FC = () => {
  const { user } = useAuth();
  const {
    currentRequest,
    assignedProvider,
    searchingProviders,
    requestService,
    cancelRequest,
    completeService,
    isConnected,
  } = useMatching();
  const insets = useSafeAreaInsets();


  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  
  const [appState, setAppState] = useState<'home' | 'services' | 'serviceSelected' | 'searching' | 'matched' | 'inService' | 'completed' | 'payment' | 'paymentSuccess'>('home');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPriceOfferModal, setShowPriceOfferModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [serviceCompleted, setServiceCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const { showSuccess, showError, showInfo, ToastComponent } = useToast();

  useEffect(() => {
    getCurrentLocation();
    
    // Animação do header
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Atualizar estado baseado na solicitação atual
    if (currentRequest) {
      switch (currentRequest.status) {
        case 'searching':
        case 'pending':
          setAppState('searching');
          setHasRated(false); // Reset rating state for new request
          break;
        case 'offered':
          setAppState('matched');
          // Só mostrar modal se há um prestador atribuído
          if (assignedProvider) {
            setShowPriceOfferModal(true);
          }
          break;
        case 'accepted':
          setAppState('matched');
          setShowPriceOfferModal(false);
          break;
        case 'arrived':
        case 'in_progress':
          setAppState('inService');
          break;
        case 'completed':
          setAppState('completed');
          break;
        default:
          if (appState !== 'serviceSelected' && appState !== 'services') {
            setAppState('home');
          }
      }
    } else if (appState !== 'serviceSelected' && appState !== 'services') {
      setAppState('home');
    }
  }, [currentRequest, appState]);

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
        address: address[0]?.street || 'Localização atual',
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setAppState('serviceSelected');
  };

  const handleConfirmService = async () => {
    if (!userLocation || !selectedService) {
      await feedbackService.error();
      Alert.alert('Erro', 'Localização ou serviço não disponível. Tente novamente.');
      return;
    }

    try {
      await analyticsService.trackPerformance('request_service', async () => {
        setAppState('searching');
        await feedbackService.buttonPress();
        showInfo('Procurando prestadores próximos...');

        // Analytics do serviço solicitado
        analyticsService.trackServiceRequest(selectedService.name, userLocation);

        // Simular fluxo completo para demonstração
        setTimeout(() => {
          setAppState('matched');
          showInfo('Prestador encontrado!');

          // Após 2 segundos, ir para pagamento
          setTimeout(() => {
            const serviceAmount = 150.00; // R$ 150,00
            setPaymentAmount(serviceAmount);
            setAppState('payment');
            setShowPaymentModal(true);
            showInfo('Proceda com o pagamento antes do serviço iniciar.');
          }, 2000);
        }, 3000);

        await feedbackService.success();
      });
    } catch (error) {
      console.error('Erro ao solicitar serviço:', error);
      await feedbackService.error();
      analyticsService.trackError(error, 'request_service');
      showError('Não foi possível solicitar o serviço. Tente novamente.');
      setAppState('home');
    }
  };

  const handleBackToHome = () => {
    setAppState('home');
    setSelectedService(null);
  };

  const handleServiceCompleted = async () => {
    try {
      setServiceCompleted(true);
      setAppState('completed');

      await feedbackService.success();
      showSuccess('Serviço concluído com sucesso!');

      // Mostrar modal de avaliação após 1 segundo
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1000);
    } catch (error) {
      console.error('Erro ao finalizar serviço:', error);
      await feedbackService.error();
      showError('Erro ao finalizar serviço. Tente novamente.');
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setShowPaymentModal(false);
      setAppState('paymentSuccess');

      await feedbackService.success();
      showSuccess('Pagamento realizado com sucesso!');

      // Aguardar 2 segundos e iniciar o serviço
      setTimeout(() => {
        setAppState('inService');
        showInfo('Prestador a caminho! Serviço iniciado.');
      }, 2000);
    } catch (error) {
      console.error('Erro após pagamento:', error);
      await feedbackService.error();
    }
  };

  const handlePaymentError = async (error: any) => {
    console.error('Erro no pagamento:', error);
    await feedbackService.error();
    showError('Erro no pagamento. Tente novamente.');
    setShowPaymentModal(false);
    setAppState('inService');
  };

  const handleAcceptOffer = async () => {
    if (!currentRequest) return;

    try {
      setShowPriceOfferModal(false);
      await feedbackService.serviceAccepted();
      showSuccess('Oferta aceita! O prestador está a caminho.');

      // Obter token do AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      // Atualizar status da solicitação para 'accepted'
      const response = await fetch(`${API_BASE_URL}/requests/${currentRequest.id}/client-accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
      });

      if (response.ok) {
        setAppState('matched');
        analyticsService.track('offer_accepted', {
          request_id: currentRequest.id,
          provider_id: assignedProvider?.id,
          service_category: selectedService?.name,
        });
      } else {
        throw new Error('Falha ao aceitar oferta');
      }
    } catch (error) {
      console.error('❌ [CLIENT] Erro ao aceitar oferta:', error);
      showError('Erro ao aceitar oferta. Tente novamente.');
      setShowPriceOfferModal(true); // Mostrar modal novamente
    }
  };

  const handleDeclineOffer = async () => {
    if (!currentRequest) return;

    try {
      setShowPriceOfferModal(false);
      await feedbackService.serviceRejected();

      // Obter token do AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      // Recusar a oferta atual e buscar outro prestador
      const response = await fetch(`${API_BASE_URL}/requests/${currentRequest.id}/client-decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
      });

      if (response.ok) {
        setAppState('searching');
        showInfo('Procurando outro prestador...');

        analyticsService.track('offer_declined', {
          request_id: currentRequest.id,
          provider_id: assignedProvider?.id,
          service_category: selectedService?.name,
        });
      } else {
        throw new Error('Falha ao recusar oferta');
      }
    } catch (error) {
      console.error('❌ [CLIENT] Erro ao recusar oferta:', error);
      showError('Erro ao recusar oferta. Tente novamente.');
      setShowPriceOfferModal(true); // Mostrar modal novamente
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
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Cliente'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#8E8E93" />
            <Text style={styles.locationText} numberOfLines={1}>
              {userLocation?.address || 'Obtendo localização...'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {currentRequest && currentRequest.status === 'completed' && !hasRated && (
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => setShowFeedbackModal(true)}
            >
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.feedbackButtonText}>Avaliar</Text>
            </TouchableOpacity>
          )}
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

  const renderBottomSheetContent = () => {
    switch (appState) {
      case 'services':
        return (
          <BottomSheetContent
            title="Todos os Serviços"
            subtitle="Escolha o profissional que você precisa"
            actions={[
              {
                title: 'Voltar',
                onPress: () => setAppState('home'),
                style: 'secondary',
                icon: 'arrow-back',
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Lista completa de serviços */}
              <View style={styles.allServicesGrid}>
                {SERVICE_CATEGORIES.map((service, index) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.fullServiceCard}
                    onPress={() => handleServiceSelect(service)}
                  >
                    <View style={[styles.fullServiceIcon, { backgroundColor: service.color }]}>
                      <Text style={styles.fullServiceEmoji}>{service.icon}</Text>
                    </View>
                    <View style={styles.fullServiceInfo}>
                      <Text style={styles.fullServiceName}>{service.name}</Text>
                      <Text style={styles.fullServiceDescription}>
                        Profissionais qualificados
                      </Text>
                      <View style={styles.fullServiceFooter}>
                        <View style={styles.availabilityBadge}>
                          <View style={styles.availabilityDot} />
                          <Text style={styles.availabilityText}>Disponível</Text>
                        </View>
                        <Text style={styles.servicePrice}>A partir de R$ 50</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Informações removidas para layout mais compacto */}
            </ScrollView>
          </BottomSheetContent>
        );

      case 'serviceSelected':
        return (
          <BottomSheetContent
            title={`${selectedService?.name}`}
            subtitle="Confirme os detalhes do seu serviço"
            actions={[
              {
                title: 'Voltar',
                onPress: () => setAppState('services'),
                style: 'secondary',
                icon: 'arrow-back',
              },
              {
                title: 'Solicitar Serviço',
                onPress: handleConfirmService,
                style: 'primary',
                icon: 'checkmark-circle',
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={styles.serviceDetailsContent}>
                <View style={styles.serviceHeader}>
                  <View style={[styles.serviceIconLarge, { backgroundColor: selectedService?.color }]}>
                    <Text style={styles.serviceEmojiLarge}>{selectedService?.icon}</Text>
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{selectedService?.name}</Text>
                    <Text style={styles.serviceDescription}>
                      Profissionais qualificados próximos a você
                    </Text>
                  </View>
                </View>

                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color="#007AFF" />
                  <Text style={styles.locationText}>
                    {userLocation?.address || 'Sua localização atual'}
                  </Text>
                </View>

                {/* Informação compacta sobre preço */}
                <View style={styles.priceInfoCard}>
                  <Ionicons name="information-circle" size={16} color="#007AFF" />
                  <Text style={styles.priceInfoText}>
                    O prestador definirá o valor baseado na complexidade do serviço
                  </Text>
                </View>


              </View>
            </ScrollView>
          </BottomSheetContent>
        );

      case 'searching':
        return (
          <BottomSheetContent
            title="Procurando prestador..."
            subtitle="Aguarde enquanto encontramos o melhor profissional para você"
            actions={[
              {
                title: 'Cancelar busca',
                onPress: () => {
                  cancelRequest();
                  setAppState('home');
                },
                style: 'danger',
                icon: 'close-circle',
              },
            ]}
          >
            {userLocation && (
              <TripInfoCard
                clientLocation={userLocation}
                status="searching"
                category={selectedService?.name}
                price={selectedService?.basePrice}
              />
            )}
            <View style={styles.searchingContent}>
              <LoadingAnimation size={60} type="pulse" color="#007AFF" />
              <Text style={styles.searchingText}>
                Estamos procurando prestadores próximos a você...
              </Text>
            </View>
          </BottomSheetContent>
        );

      case 'matched':
        return (
          <BottomSheetContent
            title={`${assignedProvider?.name} aceitou seu pedido!`}
            subtitle="O prestador está a caminho"
            actions={[
              {
                title: 'Ligar para o prestador',
                onPress: () => {},
                style: 'primary',
                icon: 'call',
              },
              {
                title: 'Enviar mensagem',
                onPress: () => {},
                style: 'secondary',
                icon: 'chatbubble',
              },
            ]}
          >
            {userLocation && assignedProvider && (
              <TripInfoCard
                clientLocation={userLocation}
                providerLocation={assignedProvider.location}
                status="matched"
                providerName={assignedProvider.name}
                category={currentRequest?.category}
                price={currentRequest?.price}
              />
            )}
            <View style={styles.providerInfo}>
              <View style={styles.providerAvatar}>
                <Text style={styles.providerInitial}>
                  {assignedProvider?.name?.charAt(0) || 'P'}
                </Text>
              </View>
              <View style={styles.providerDetails}>
                <Text style={styles.providerName}>{assignedProvider?.name}</Text>
                <Text style={styles.providerCategory}>{assignedProvider?.category}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {assignedProvider?.rating?.toFixed(1) || '5.0'}
                  </Text>
                </View>
              </View>
            </View>
          </BottomSheetContent>
        );

      case 'inService':
        return (
          <BottomSheetContent
            title="Serviço em andamento"
            subtitle={`${assignedProvider?.name} está realizando o serviço`}
            actions={[
              {
                title: 'Finalizar Serviço',
                onPress: handleServiceCompleted,
                style: 'primary',
                icon: 'checkmark-circle',
              },
              {
                title: 'Ligar para o prestador',
                onPress: () => {},
                style: 'secondary',
                icon: 'call',
              },
              {
                title: 'Enviar mensagem',
                onPress: () => {},
                style: 'secondary',
                icon: 'chatbubble',
              },
            ]}
          >
            <ClientProgressTracker
              userLocation={userLocation}
              providerLocation={assignedProvider?.location}
            />
            <View style={styles.serviceInProgressInfo}>
              <Ionicons name="construct" size={48} color="#FF9500" />
              <Text style={styles.serviceInProgressTitle}>Serviço em andamento</Text>
              <Text style={styles.serviceInProgressText}>
                O prestador está trabalhando no seu serviço. Você será notificado quando concluído.
              </Text>
            </View>
          </BottomSheetContent>
        );

      case 'completed':
        return (
          <BottomSheetContent
            title="Serviço Concluído!"
            subtitle="Como foi sua experiência?"
            actions={[
              {
                title: 'Avaliar prestador',
                onPress: () => setShowFeedbackModal(true),
                style: 'primary',
                icon: 'star',
              },
              {
                title: 'Solicitar novamente',
                onPress: () => {
                  setAppState('home');
                },
                style: 'secondary',
                icon: 'refresh',
              },
            ]}
          >
            <View style={styles.completedContainer}>
              <View style={styles.completedIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#34C759" />
              </View>
              <Text style={styles.completedTitle}>Serviço finalizado com sucesso!</Text>
              <Text style={styles.completedSubtitle}>
                O prestador finalizou o serviço. Esperamos que tenha ficado satisfeito!
              </Text>

              {currentRequest && (
                <View style={styles.serviceDetails}>
                  <Text style={styles.serviceDetailsTitle}>Detalhes do serviço:</Text>
                  <Text style={styles.serviceDetailsText}>
                    {currentRequest.category} - R$ {currentRequest.price?.toFixed(2)}
                  </Text>
                  <Text style={styles.serviceDetailsText}>
                    {currentRequest.description}
                  </Text>
                </View>
              )}
            </View>
          </BottomSheetContent>
        );

      case 'payment':
        return (
          <BottomSheetContent
            title="Pagamento Necessário"
            subtitle="Pague antes do serviço iniciar"
            actions={[
              {
                title: 'Cancelar Solicitação',
                onPress: () => setAppState('home'),
                style: 'secondary',
                icon: 'close',
              },
            ]}
          >
            <View style={styles.paymentContainer}>
              <View style={styles.paymentIcon}>
                <Ionicons name="card" size={64} color="#007AFF" />
              </View>
              <Text style={styles.paymentTitle}>Prestador encontrado!</Text>
              <Text style={styles.paymentSubtitle}>
                Pague R$ {paymentAmount.toFixed(2)} para confirmar o serviço
              </Text>
              <Text style={styles.paymentDescription}>
                O pagamento será processado de forma segura. Após a confirmação, o prestador iniciará o serviço.
              </Text>
            </View>
          </BottomSheetContent>
        );

      case 'paymentSuccess':
        return (
          <BottomSheetContent
            title="Pagamento Realizado!"
            subtitle="Seu pagamento foi processado com sucesso"
            actions={[
              {
                title: 'Continuar',
                onPress: () => setAppState('completed'),
                style: 'primary',
                icon: 'checkmark-circle',
              },
            ]}
          >
            <View style={styles.paymentSuccessContainer}>
              <View style={styles.paymentSuccessIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#34C759" />
              </View>
              <Text style={styles.paymentSuccessTitle}>Pagamento confirmado!</Text>
              <Text style={styles.paymentSuccessSubtitle}>
                R$ {paymentAmount.toFixed(2)} foi debitado com sucesso
              </Text>
              <Text style={styles.paymentSuccessDescription}>
                Obrigado por usar nossos serviços!
              </Text>
            </View>
          </BottomSheetContent>
        );

      default:
        return (
          <BottomSheetContent title="O que você precisa hoje?">
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Serviço em Destaque */}
              <TouchableOpacity
                style={styles.featuredServiceCard}
                onPress={() => handleServiceSelect({
                  id: 'express',
                  name: 'Serviço Express',
                  icon: '⚡',
                  color: '#FF6B35'
                })}
              >
                <View style={styles.featuredServiceContent}>
                  <View style={styles.featuredServiceLeft}>
                    <View style={[styles.featuredServiceIcon, { backgroundColor: '#FF6B35' }]}>
                      <Text style={styles.featuredServiceEmoji}>⚡</Text>
                    </View>
                    <View style={styles.featuredServiceInfo}>
                      <Text style={styles.featuredServiceTitle}>Serviço Express</Text>
                      <Text style={styles.featuredServiceSubtitle}>
                        Atendimento em até 30 minutos
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </View>
              </TouchableOpacity>

              {/* Seção de Categorias */}
              <View style={styles.categoriesSection}>
                <Text style={styles.sectionTitle}>Escolha o serviço</Text>
                <Text style={styles.sectionSubtitle}>
                  Profissionais qualificados próximos a você
                </Text>

                <View style={styles.servicesGrid}>
                  {SERVICE_CATEGORIES.map((service, index) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceCard,
                        {
                          animationDelay: `${index * 100}ms`,
                        }
                      ]}
                      onPress={() => handleServiceSelect(service)}
                    >
                      <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                        <Text style={styles.serviceIcon}>{service.icon}</Text>
                      </View>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <View style={styles.serviceFooter}>
                        <Text style={styles.serviceAvailable}>Disponível</Text>
                        <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Seção de Informações */}
              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                  <Text style={styles.infoText}>Profissionais verificados</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time" size={20} color="#007AFF" />
                  <Text style={styles.infoText}>Atendimento rápido</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="card" size={20} color="#FF9500" />
                  <Text style={styles.infoText}>Pagamento seguro</Text>
                </View>
              </View>
            </ScrollView>
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
      {assignedProvider && userLocation ? (
        <UberStyleMap
          style={styles.map}
          clientLocation={userLocation}
          providerLocation={assignedProvider.location ? {
            latitude: assignedProvider.location.latitude,
            longitude: assignedProvider.location.longitude,
          } : undefined}
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

      {/* Simple Bottom Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {renderBottomSheetContent()}
      </View>

      {/* Toast Notifications */}
      <ToastComponent />

      {/* Floating Action Button - Feedback (apenas quando serviço concluído e não avaliado) */}
      {currentRequest && currentRequest.status === 'completed' && !hasRated && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: '#FFD700' }]}
          onPress={() => setShowFeedbackModal(true)}
        >
          <Ionicons name="star" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Modals */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ClientHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <PriceOfferModal
        visible={showPriceOfferModal}
        provider={assignedProvider ? {
          id: assignedProvider.id,
          name: assignedProvider.name || 'Prestador',
          rating: assignedProvider.rating || 5.0,
          distance: 2.5, // Mock distance
          price: currentRequest?.price || 50,
          category: currentRequest?.category || 'Serviço',
          estimatedTime: 15,
        } : null}
        onAccept={handleAcceptOffer}
        onDecline={handleDeclineOffer}
        onClose={() => setShowPriceOfferModal(false)}
      />

      <InteractiveFeedback
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        requestId={currentRequest?.id || ''}
        providerName={assignedProvider?.name}
        onSubmit={async (rating: number, comment?: string) => {
          try {
            await completeService(rating, comment);
            setHasRated(true);
            setShowFeedbackModal(false);
            console.log('✅ [FEEDBACK] Avaliação enviada com sucesso');
          } catch (error) {
            console.error('❌ [FEEDBACK] Erro ao enviar avaliação:', error);
          }
        }}
        type="service_completed"
      />

      <PaymentCheckoutModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        requestId={currentRequest?.id || ''}
        amount={paymentAmount}
        description={`Pagamento do serviço: ${selectedService?.name}`}
        providerName={assignedProvider?.name || 'Prestador'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
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
              setAppState('services');
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginRight: 12,
  },
  feedbackButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8F00',
  },
  profileButton: {
    padding: 4,
  },
  searchingContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchingAnimation: {
    marginBottom: 20,
  },
  searchingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  serviceDetailsContent: {
    paddingVertical: 20,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceEmojiLarge: {
    fontSize: 28,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
    flex: 1,
  },
  priceNote: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
  },
  featuredServiceCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  featuredServiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featuredServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featuredServiceEmoji: {
    fontSize: 24,
  },
  featuredServiceInfo: {
    flex: 1,
  },
  featuredServiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  featuredServiceSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    fontSize: 20,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceAvailable: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
    fontWeight: '500',
  },
  allServicesGrid: {
    paddingBottom: 20,
  },
  fullServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullServiceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fullServiceEmoji: {
    fontSize: 24,
  },
  fullServiceInfo: {
    flex: 1,
  },
  fullServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  fullServiceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  fullServiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  additionalInfo: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
  },
  serviceInfoSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  serviceInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  expectationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expectationText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  priceInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  priceInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  priceInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  priceInfoText: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  providerInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  providerCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    paddingHorizontal: 20,
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
  serviceInProgressInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  serviceInProgressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  serviceInProgressText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
   // paddingBottom: 34, // Safe area para tab bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '70%', // Altura máxima reduzida para garantir botões visíveis
  },
  // Payment Styles
  paymentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  paymentIcon: {
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  paymentSubtitle: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  paymentDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Payment Success Styles
  paymentSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  paymentSuccessIcon: {
    marginBottom: 16,
  },
  paymentSuccessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
    textAlign: 'center',
  },
  paymentSuccessSubtitle: {
    fontSize: 18,
    color: '#1D1D1F',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  paymentSuccessDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
