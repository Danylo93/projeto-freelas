import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseRealtime } from '../../contexts/FirebaseRealtimeContext';
import { useLocation } from '../../contexts/LocationContext';
import { useInFlightGuard } from '../../hooks/useInFlightGuard';
import { FirebaseAnimatedMapView } from '../../components/FirebaseAnimatedMapView';
import { ModernBottomSheet } from '../../components/ModernBottomSheet';
import { SearchingAnimation } from '../../components/SearchingAnimation';
import { ModernToast } from '../../components/ModernToast';
import { MainAppBar } from '../../components/ui/AppBar';
import { CategoryChip } from '../../components/ui/Chip';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

const categories = [
  { id: 'plumbing', name: 'Encanamento', icon: '🔧', description: 'Reparos e instalações' },
  { id: 'electrical', name: 'Elétrica', icon: '⚡', description: 'Instalações elétricas' },
  { id: 'cleaning', name: 'Limpeza', icon: '🧹', description: 'Serviços de limpeza' },
  { id: 'gardening', name: 'Jardinagem', icon: '🌱', description: 'Cuidados com plantas' },
  { id: 'painting', name: 'Pintura', icon: '🎨', description: 'Pintura e acabamentos' },
  { id: 'carpentry', name: 'Marcenaria', icon: '🔨', description: 'Móveis e madeira' },
];

type RequestStatus = 'pending' | 'offered' | 'accepted' | 'en_route' | 'arrived' | 'started' | 'completed' | 'cancelled';

interface ServiceRequest {
  id: string;
  category: string;
  description: string;
  address: string;
  status: RequestStatus;
  price?: number;
  providerId?: string;
  providerName?: string;
  providerRating?: number;
  createdAt: number;
  updatedAt: number;
}

export default function HomeFirebaseScreen() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { user } = useAuth();
  const { 
    isConnected, 
    updateRequestStatus, 
    subscribeToRequest,
    createOffer,
    acceptOffer,
    rejectOffer
  } = useFirebaseRealtime();
  const { location, requestLocationPermission } = useLocation();
  const { startOperation, endOperation, isOperationInFlight } = useInFlightGuard();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showSearching, setShowSearching] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    visible: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Subscribe to request updates
  useEffect(() => {
    if (!currentRequest?.id) return;

    const unsubscribe = subscribeToRequest(currentRequest.id, (data) => {
      if (data) {
        setCurrentRequest(data);
        handleRequestStatusUpdate(data);
      }
    });

    return unsubscribe;
  }, [currentRequest?.id, subscribeToRequest]);

  const handleRequestStatusUpdate = useCallback((request: ServiceRequest) => {
    switch (request.status) {
      case 'offered':
        setShowSearching(false);
        setToast({
          visible: true,
          message: `Oferta recebida de ${request.providerName || 'prestador'}!`,
          type: 'success'
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'accepted':
        setToast({
          visible: true,
          message: 'Solicitação aceita! O prestador está a caminho.',
          type: 'success'
        });
        setShowMap(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'en_route':
        setToast({
          visible: true,
          message: 'Prestador está a caminho!',
          type: 'info'
        });
        break;
      case 'arrived':
        setToast({
          visible: true,
          message: 'Prestador chegou!',
          type: 'success'
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'completed':
        setToast({
          visible: true,
          message: 'Serviço concluído! Avalie o prestador.',
          type: 'success'
        });
        setCurrentRequest(null);
        setShowMap(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'cancelled':
        setToast({
          visible: true,
          message: 'Solicitação cancelada.',
          type: 'warning'
        });
        setCurrentRequest(null);
        setShowMap(false);
        setShowSearching(false);
        break;
    }
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleRequestService = async () => {
    if (!selectedCategory) {
      setToast({
        visible: true,
        message: 'Selecione uma categoria de serviço',
        type: 'warning'
      });
      return;
    }

    if (!serviceDescription.trim()) {
      setToast({
        visible: true,
        message: 'Descreva o serviço necessário',
        type: 'warning'
      });
      return;
    }

    if (!serviceAddress.trim()) {
      setToast({
        visible: true,
        message: 'Informe o endereço do serviço',
        type: 'warning'
      });
      return;
    }

    if (!location) {
      setToast({
        visible: true,
        message: 'Localização não disponível',
        type: 'error'
      });
      return;
    }

    const operationId = 'request_service';
    if (isOperationInFlight(operationId)) {
      setToast({
        visible: true,
        message: 'Solicitação já em andamento',
        type: 'warning'
      });
      return;
    }

    if (!startOperation(operationId)) return;

    try {
      const requestId = `req_${Date.now()}_${user?.id}`;
      const newRequest: ServiceRequest = {
        id: requestId,
        category: selectedCategory,
        description: serviceDescription,
        address: serviceAddress,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setCurrentRequest(newRequest);
      setShowSearching(true);

      // Simulate creating request in Firebase
      await updateRequestStatus(requestId, 'pending', newRequest);

      setToast({
        visible: true,
        message: 'Solicitação enviada! Procurando prestadores...',
        type: 'success'
      });

      // Simulate provider offer after 3 seconds
      setTimeout(async () => {
        if (currentRequest?.id) {
          await updateRequestStatus(requestId, 'offered', {
            providerId: 'provider_123',
            providerName: 'João Silva',
            providerRating: 4.8,
            price: 150.00
          });
        }
      }, 3000);

    } catch (error) {
      console.error('Error creating request:', error);
      setToast({
        visible: true,
        message: 'Erro ao enviar solicitação',
        type: 'error'
      });
    } finally {
      endOperation(operationId);
    }
  };

  const handleAcceptOffer = async () => {
    if (!currentRequest?.id) return;

    const operationId = 'accept_offer';
    if (isOperationInFlight(operationId)) return;

    if (!startOperation(operationId)) return;

    try {
      await updateRequestStatus(currentRequest.id, 'accepted', {
        assignedProvider: currentRequest.providerId
      });

      setToast({
        visible: true,
        message: 'Oferta aceita!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error accepting offer:', error);
      setToast({
        visible: true,
        message: 'Erro ao aceitar oferta',
        type: 'error'
      });
    } finally {
      endOperation(operationId);
    }
  };

  const handleRejectOffer = async () => {
    if (!currentRequest?.id) return;

    const operationId = 'reject_offer';
    if (isOperationInFlight(operationId)) return;

    if (!startOperation(operationId)) return;

    try {
      await updateRequestStatus(currentRequest.id, 'pending', {
        providerId: null,
        providerName: null,
        providerRating: null,
        price: null
      });

      setToast({
        visible: true,
        message: 'Oferta rejeitada',
        type: 'info'
      });
    } catch (error) {
      console.error('Error rejecting offer:', error);
      setToast({
        visible: true,
        message: 'Erro ao rejeitar oferta',
        type: 'error'
      });
    } finally {
      endOperation(operationId);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentRequest?.id) return;

    const operationId = 'cancel_request';
    if (isOperationInFlight(operationId)) return;

    if (!startOperation(operationId)) return;

    try {
      await updateRequestStatus(currentRequest.id, 'cancelled');
      setCurrentRequest(null);
      setShowMap(false);
      setShowSearching(false);
      setToast({
        visible: true,
        message: 'Solicitação cancelada',
        type: 'info'
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      setToast({
        visible: true,
        message: 'Erro ao cancelar solicitação',
        type: 'error'
      });
    } finally {
      endOperation(operationId);
    }
  };

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <Card
          title="Conexão"
          content="Conectando ao servidor..."
          variant="outlined"
          style={[styles.statusCard, { borderColor: theme.colors.warning }]}
        />
      );
    }

    return (
      <Card
        title="Conexão"
        content="Conectado via Firebase Realtime"
        variant="outlined"
        style={[styles.statusCard, { borderColor: theme.colors.success }]}
      />
    );
  };

  const renderCategorySelection = () => {
    return (
      <View style={styles.section}>
        <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface, marginBottom: theme.spacing.md }]}>
          O que você precisa?
        </Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              selected={selectedCategory === category.id}
              onSelect={handleCategorySelect}
              style={styles.categoryChip}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderServiceRequest = () => {
    if (!selectedCategory) return null;

    const category = categories.find(c => c.id === selectedCategory);
    
    return (
      <Card
        title={`Solicitar ${category?.name}`}
        style={styles.serviceRequestCard}
      >
        <View style={styles.serviceRequestContent}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.md }]}>
            Descreva o serviço que você precisa:
          </Text>
          
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.surfaceContainer,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            }]}
            placeholder="Ex: Preciso consertar uma torneira que está vazando"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={serviceDescription}
            onChangeText={setServiceDescription}
            multiline
            numberOfLines={3}
          />
          
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }]}>
            Endereço do serviço:
          </Text>
          
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.surfaceContainer,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            }]}
            placeholder="Rua, número, bairro, cidade"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={serviceAddress}
            onChangeText={setServiceAddress}
          />
          
          <View style={styles.actionButtons}>
            <SecondaryButton
              title="Cancelar"
              onPress={() => setSelectedCategory(null)}
              style={styles.actionButton}
            />
            
            <PrimaryButton
              title="Solicitar Serviço"
              onPress={handleRequestService}
              loading={isOperationInFlight('request_service')}
              style={styles.actionButton}
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderOfferCard = () => {
    if (!currentRequest || currentRequest.status !== 'offered') return null;

    return (
      <Card
        title="Oferta Recebida"
        style={[styles.offerCard, { borderColor: theme.colors.success }]}
      >
        <View style={styles.offerContent}>
          <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface, marginBottom: 8 }]}>
            {currentRequest.providerName}
          </Text>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant, marginBottom: 8 }]}>
            ⭐ {currentRequest.providerRating} • R$ {currentRequest.price?.toFixed(2)}
          </Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
            {currentRequest.description}
          </Text>
          
          <View style={styles.offerActions}>
            <SecondaryButton
              title="Recusar"
              onPress={handleRejectOffer}
              loading={isOperationInFlight('reject_offer')}
              style={styles.offerButton}
            />
            <PrimaryButton
              title="Aceitar"
              onPress={handleAcceptOffer}
              loading={isOperationInFlight('accept_offer')}
              style={styles.offerButton}
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderRequestStatus = () => {
    if (!currentRequest) return null;

    const getStatusText = () => {
      switch (currentRequest.status) {
        case 'pending': return 'Aguardando prestadores...';
        case 'offered': return 'Oferta recebida!';
        case 'accepted': return 'Solicitação aceita';
        case 'en_route': return 'Prestador a caminho';
        case 'arrived': return 'Prestador chegou';
        case 'started': return 'Serviço em andamento';
        case 'completed': return 'Serviço concluído';
        case 'cancelled': return 'Solicitação cancelada';
        default: return 'Status desconhecido';
      }
    };

    return (
      <Card
        title="Status da Solicitação"
        style={styles.statusCard}
      >
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
          {getStatusText()}
        </Text>
        {currentRequest.status !== 'completed' && currentRequest.status !== 'cancelled' && (
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.colors.error }]}
            onPress={handleCancelRequest}
            disabled={isOperationInFlight('cancel_request')}
          >
            <Text style={[styles.cancelButtonText, { color: '#FFFFFF' }]}>
              Cancelar Solicitação
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MainAppBar
        user={user ? { name: user.name } : undefined}
        notifications={{ count: 0, onPress: () => {} }}
        onProfilePress={() => {}}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderConnectionStatus()}
        {renderCategorySelection()}
        {renderServiceRequest()}
        {renderOfferCard()}
        {renderRequestStatus()}
      </ScrollView>

      {/* Map View */}
      {showMap && location && (
        <View style={styles.mapContainer}>
          <FirebaseAnimatedMapView
            providerId={currentRequest?.providerId || null}
            clientLocation={location}
            showPolyline={true}
            followProvider={true}
          />
        </View>
      )}

      {/* Searching Animation */}
      <SearchingAnimation
        isVisible={showSearching}
        message="Procurando prestadores próximos..."
        onComplete={() => setShowSearching(false)}
      />

      {/* Toast */}
      <ModernToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  serviceRequestCard: {
    marginTop: 16,
  },
  serviceRequestContent: {
    gap: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  statusCard: {
    marginBottom: 16,
  },
  offerCard: {
    marginBottom: 16,
    borderWidth: 2,
  },
  offerContent: {
    gap: 8,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  offerButton: {
    flex: 1,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
});
