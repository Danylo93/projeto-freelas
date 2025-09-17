import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios, { isAxiosError } from 'axios';

import CustomMapView, { LatLng } from '@/components/CustomMapView';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
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

type NormalizedProvider = Provider & { __cacheKey: string };

const SUGGESTED_CATEGORIES = ['Encanador', 'Eletricista', 'Limpeza', 'Jardinagem', 'Pintura', 'Reformas'];

const normalizeProviders = (list: Provider[]): NormalizedProvider[] => {
  const seenIds = new Set<string>();
  const usedKeys = new Set<string>();

  return list.reduce<NormalizedProvider[]>((acc, provider, index) => {
    const trimmedId = provider.id?.trim();
    const trimmedUserId = provider.user_id?.trim();
    const dedupeKey = trimmedId || trimmedUserId;

    if (dedupeKey && seenIds.has(dedupeKey)) {
      return acc;
    }

    if (dedupeKey) {
      seenIds.add(dedupeKey);
    }

    const baseKey =
      dedupeKey || provider.phone?.trim() || provider.name?.trim() || `provider-${index}`;

    let cacheKey = baseKey || `provider-${index}`;
    let suffix = 1;
    while (usedKeys.has(cacheKey)) {
      cacheKey = `${baseKey}-${suffix++}`;
    }
    usedKeys.add(cacheKey);

    acc.push({
      ...provider,
      __cacheKey: cacheKey,
    });
    return acc;
  }, []);
};

interface ServiceRequest {
  id: string;
  client_id: string;
  provider_id?: string;
  category: string;
  description?: string;
  price: number;
  status: string;
  client_latitude: number;
  client_longitude: number;
  provider_latitude?: number;
  provider_longitude?: number;
  estimated_time?: number;
}

interface ProviderLocationUpdatePayload {
  request_id?: string;
  requestId?: string;
  provider_latitude?: number;
  provider_longitude?: number;
  latitude?: number;
  longitude?: number;
  location?: { lat?: number; lng?: number };
  estimated_time?: number;
  eta?: number;
  eta_minutes?: number;
  distance?: number;
  distance_km?: number;
}

interface LifecyclePayload {
  request_id?: string;
  requestId?: string;
  id?: string;
  provider_id?: string;
  status?: string;
  type?: string;
  event?: string;
  name?: string;
}

const generateRequestId = () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getStatusCopy = (status: string, providerName?: string | null) => {
  switch (status) {
    case 'pending':
      return 'Buscando prestadores disponíveis...';
    case 'offered':
      return providerName
        ? `Oferta enviada para ${providerName}. Aguardando confirmação.`
        : 'Oferta enviada para prestadores disponíveis.';
    case 'accepted':
      return providerName
        ? `${providerName} aceitou o serviço e está a caminho!`
        : 'Prestador aceitou o serviço. Preparando deslocamento...';
    case 'in_progress':
      return 'Prestador a caminho do endereço informado.';
    case 'near_client':
      return 'O prestador chegou ao local!';
    case 'started':
      return 'Serviço em andamento.';
    case 'completed':
      return 'Serviço concluído! Avalie sua experiência.';
    default:
      return '';
  }
};

export default function ClientScreen() {
  const { user, token, logout, getAuthHeaders } = useAuth();
  const { startPayment } = usePayment();
  const { socket, isConnected } = useSocket();

  const [providers, setProviders] = useState<NormalizedProvider[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [assignedProvider, setAssignedProvider] = useState<NormalizedProvider | null>(null);

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [requestForm, setRequestForm] = useState({ category: '', description: '', price: '' });

  const providerConfigAlertShown = useRef(false);
  const requestConfigAlertShown = useRef(false);
  const requestPollRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<ServiceRequest | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);


  const fetchCurrentLocation = useCallback(async (): Promise<LatLng | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para encontrar prestadores próximos.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      return null;
    }
  }, []);

  const stopRequestPolling = useCallback(() => {
    if (requestPollRef.current) {
      clearInterval(requestPollRef.current);
      requestPollRef.current = null;
    }
  }, []);

  const syncAssignedProvider = useCallback(
    async (providerId: string, fallbackList?: NormalizedProvider[]) => {
      const list = fallbackList ?? providers;
      const cached = list.find(
        (prov) => prov.id === providerId || prov.user_id === providerId
      );
      if (cached) {
        setAssignedProvider(cached);
        return cached;
      }

      if (!PROVIDERS_API_URL) {
        return null;
      }

      try {
        const response = await axios.get(PROVIDERS_API_URL, {
          headers: getAuthHeaders(),
        });
        const fetched: Provider[] = response.data;
        const normalized = normalizeProviders(fetched);
        setProviders(normalized);
        const categories = Array.from(
          new Set(normalized.map((prov) => prov.category).filter(Boolean))
        ).sort();
        setAvailableCategories(categories);
        const found =
          normalized.find((prov) => prov.id === providerId || prov.user_id === providerId) ?? null;
        setAssignedProvider(found);
        return found;
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log('ℹ️ [CLIENT] Nenhum prestador encontrado para sincronizar no momento.');
        } else {
          console.error(
            'Erro ao buscar prestador associado:',
            error.response?.data ?? error.message
          );
        }
      } else {
        console.error('Erro ao buscar prestador associado:', error);
      }
      return null;
    }
  },
  [getAuthHeaders, providers]
);

  const refreshCurrentRequest = useCallback(
    async (requestId: string) => {
      if (!REQUESTS_API_URL) {
        return null;
      }

      try {
        const response = await axios.get(REQUESTS_API_URL, {
          headers: getAuthHeaders(),
        });
        const allRequests: ServiceRequest[] = response.data;
        const found = allRequests.find((req) => req.id === requestId) ?? null;

        if (!found) {
          setCurrentRequest(null);
          setAssignedProvider(null);
          setShowMap(false);
          setShowRatingModal(false);
          setStatusMessage('');
          stopRequestPolling();
          return null;
        }

        setCurrentRequest((prev) => ({
          ...prev,
          ...found,
          estimated_time: found.estimated_time ?? prev?.estimated_time,
          provider_latitude: found.provider_latitude ?? prev?.provider_latitude,
          provider_longitude: found.provider_longitude ?? prev?.provider_longitude,
        }));

        if (found.provider_id) {
          await syncAssignedProvider(found.provider_id, providers);
        }

        if (found.status === 'completed') {
          stopRequestPolling();
        }

        return found;
      } catch (error) {
        console.error('Erro ao atualizar solicitação:', error);
        return null;
      }
    },
    [getAuthHeaders, providers, stopRequestPolling, syncAssignedProvider]
  );

  const startRequestPolling = useCallback(
    (requestId: string) => {
      stopRequestPolling();
      if (!REQUESTS_API_URL) {
        return;
      }
      // Aumentar intervalo para reduzir requisições
      requestPollRef.current = setInterval(() => {
        refreshCurrentRequest(requestId);
      }, 10000) as any; // 10 segundos em vez de 5
    },
    [refreshCurrentRequest, stopRequestPolling]
  );

  const loadProviders = useCallback(async () => {
    if (!PROVIDERS_API_URL) {
      if (!providerConfigAlertShown.current) {
        Alert.alert('Configuração necessária', PROVIDER_SERVICE_CONFIG_ERROR);
        providerConfigAlertShown.current = true;
      }
      setProviders([]);
      setAvailableCategories([]);
      return;
    }

    // Evitar múltiplas requisições simultâneas
    if (isRequesting) {
      console.log('⏳ [CLIENT] Requisição já em andamento, ignorando...');
      return;
    }

    try {
      setIsRequesting(true);
      setLoadingProviders(true);
      const response = await axios.get(PROVIDERS_API_URL, {
        headers: getAuthHeaders(),
      });
      const list: Provider[] = response.data;
      const normalized = normalizeProviders(list);
      setProviders(normalized);
      const categories = Array.from(
        new Set(normalized.map((prov) => prov.category).filter(Boolean))
      ).sort();
      setAvailableCategories(categories);

      const activeProviderId = currentRequestRef.current?.provider_id;
      if (activeProviderId) {
        const match = normalized.find(
          (prov) => prov.id === activeProviderId || prov.user_id === activeProviderId
        );
        if (match) {
          setAssignedProvider(match);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar prestadores:', error);
      
      // Tratar erros específicos
      if (error.response?.status === 403) {
        Alert.alert('Acesso Negado', 'Você não tem permissão para acessar os prestadores. Faça login novamente.');
        logout();
        return;
      } else if (error.response?.status === 401) {
        Alert.alert('Sessão Expirada', 'Sua sessão expirou. Faça login novamente.');
        logout();
        return;
      }
      
      // Não exibir alerta para outros erros para permitir que a tela carregue
      setProviders([]);
      setAvailableCategories([]);
    } finally {
      setLoadingProviders(false);
      setIsRequesting(false);
    }
  }, [getAuthHeaders, isRequesting]);

  const loadActiveRequest = useCallback(async () => {
    if (!REQUESTS_API_URL || !user) {
      return;
    }

    try {
      const response = await axios.get(REQUESTS_API_URL, {
        headers: getAuthHeaders(),
      });
      const allRequests: ServiceRequest[] = response.data;
      const myRequests = allRequests.filter(
        (req) => req.client_id === user.id && req.status !== 'completed'
      );
      if (myRequests.length === 0) {
        setCurrentRequest(null);
        setAssignedProvider(null);
        setShowMap(false);
        stopRequestPolling();
        return;
      }

      const latest = myRequests[myRequests.length - 1];
      setCurrentRequest((prev) => ({
        ...prev,
        ...latest,
        estimated_time: prev?.estimated_time,
        provider_latitude: latest.provider_latitude ?? prev?.provider_latitude,
        provider_longitude: latest.provider_longitude ?? prev?.provider_longitude,
      }));

      if (latest.provider_id) {
        await syncAssignedProvider(latest.provider_id, providers);
      } else {
        setAssignedProvider(null);
      }

      startRequestPolling(latest.id);
    } catch (error: any) {
      console.error('Erro ao carregar solicitações ativas:', error);
      
      // Tratar erros específicos
      if (error.response?.status === 403) {
        Alert.alert('Acesso Negado', 'Você não tem permissão para acessar as solicitações. Faça login novamente.');
        logout();
        return;
      } else if (error.response?.status === 401) {
        Alert.alert('Sessão Expirada', 'Sua sessão expirou. Faça login novamente.');
        logout();
        return;
      }
    }
  }, [getAuthHeaders, providers, startRequestPolling, stopRequestPolling, syncAssignedProvider, user]);

  useEffect(() => {
    loadProviders();
    fetchCurrentLocation();
    loadActiveRequest();
  }, [fetchCurrentLocation, loadActiveRequest, loadProviders]);

  useEffect(() => {
    if (currentRequest) {
      setStatusMessage(getStatusCopy(currentRequest.status, assignedProvider?.name));
    } else {
      setStatusMessage('');
    }
  }, [assignedProvider?.name, currentRequest]);

  useEffect(() => {
    if (!currentRequest) {
      return;
    }

    if (['accepted', 'in_progress', 'near_client', 'started'].includes(currentRequest.status)) {
      setShowMap(true);
    }

    if (currentRequest.status === 'completed') {
      setShowRatingModal(true);
      setShowMap(false);
      loadProviders();
    }
  }, [currentRequest, loadProviders]);

  useEffect(() => stopRequestPolling, [stopRequestPolling]);

  const handleLifecycleEvent = useCallback(
    (payload: LifecyclePayload) => {
      const requestId = payload.request_id ?? payload.requestId ?? payload.id;
      if (!requestId) {
        return;
      }
      if (currentRequestRef.current?.id !== requestId) {
        return;
      }
      refreshCurrentRequest(requestId);
    },
    [refreshCurrentRequest]
  );

  const handleProviderLocationUpdate = useCallback(
    (data: ProviderLocationUpdatePayload) => {
      const requestId = data.request_id ?? data.requestId;
      if (!requestId) {
        return;
      }

      let nextMessage: string | null = null;
      setCurrentRequest((prev) => {
        if (!prev || prev.id !== requestId) {
          return prev;
        }

        const latitude =
          data.provider_latitude ?? data.latitude ?? data.location?.lat ?? prev.provider_latitude;
        const longitude =
          data.provider_longitude ?? data.longitude ?? data.location?.lng ?? prev.provider_longitude;
        const eta =
          data.estimated_time ?? data.eta ?? data.eta_minutes ?? prev.estimated_time;
        const distance = data.distance ?? data.distance_km;

        if (typeof distance === 'number' && typeof eta === 'number') {
          nextMessage = `🚗 Prestador a ${distance.toFixed(1)} km (${eta} min)`;
        }

        return {
          ...prev,
          provider_latitude: latitude,
          provider_longitude: longitude,
          estimated_time: typeof eta === 'number' ? eta : prev.estimated_time,
        };
      });

      if (nextMessage) {
        setStatusMessage(nextMessage);
      }
    },
    []
  );

  const setupSocketListeners = useCallback(() => {
    if (!socket) {
      return undefined;
    }

    const lifecycleEvents = [
      'request_offered',
      'request.offered',
      'request_accepted',
      'request.accepted',
      'request_status_changed',
      'request.status_changed',
      'status_updated',
      'request.lifecycle',
      'request_cancelled',
      'request.cancelled',
      'request_completed',
      'request.completed',
    ];

    const locationEvents = ['provider_location_update', 'provider.location'];

    lifecycleEvents.forEach((event) => socket.on(event, handleLifecycleEvent));
    locationEvents.forEach((event) => socket.on(event, handleProviderLocationUpdate));

    return () => {
      lifecycleEvents.forEach((event) => socket.off(event, handleLifecycleEvent));
      locationEvents.forEach((event) => socket.off(event, handleProviderLocationUpdate));
    };
  }, [handleLifecycleEvent, handleProviderLocationUpdate, socket]);

  useEffect(() => {
    const cleanup = setupSocketListeners();
    return () => {
      cleanup?.();
    };
  }, [setupSocketListeners]);

  const handleRequestService = async () => {
    if (!user) {
      return;
    }

    if (!REQUESTS_API_URL) {
      if (!requestConfigAlertShown.current) {
        Alert.alert('Configuração necessária', REQUEST_SERVICE_CONFIG_ERROR);
        requestConfigAlertShown.current = true;
      }
      return;
    }

    const category = requestForm.category.trim();
    if (!category) {
      Alert.alert('Atenção', 'Escolha ou informe a categoria do serviço.');
      return;
    }

    const priceValue = Number(requestForm.price.replace(',', '.'));
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Atenção', 'Informe um valor estimado válido.');
      return;
    }

    const location = userLocation ?? (await fetchCurrentLocation());
    if (!location) {
      return;
    }

    const payload: ServiceRequest = {
      id: generateRequestId(),
      client_id: user.id,
      category,
      description: requestForm.description.trim() || `Solicitação de ${category}`,
      client_latitude: location.latitude,
      client_longitude: location.longitude,
      price: priceValue,
      status: 'pending',
    };

    setRequestLoading(true);
    try {
      const response = await axios.post<ServiceRequest>(REQUESTS_API_URL, payload, {
        headers: getAuthHeaders(),
      });
      const created = response.data ?? payload;

      setCurrentRequest({
        ...created,
        provider_latitude: undefined,
        provider_longitude: undefined,
        estimated_time: undefined,
      });
      setAssignedProvider(null);
      setShowRequestModal(false);
      setRequestForm({ category: '', description: '', price: '' });
      setShowMap(false);
      setRating(5);
      setRatingComment('');
      setStatusMessage(getStatusCopy('pending'));
      startRequestPolling(created.id);
      Alert.alert('Solicitação enviada', 'Estamos buscando o melhor prestador disponível.');
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível criar a solicitação.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRatingSubmit = () => {
    Alert.alert('Obrigado!', 'Sua avaliação foi registrada!');
    setShowRatingModal(false);
    setCurrentRequest(null);
    setAssignedProvider(null);
    setShowMap(false);
    setStatusMessage('');
    setRating(5);
    setRatingComment('');
    stopRequestPolling();
    loadProviders();
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    SUGGESTED_CATEGORIES.forEach((item) => set.add(item));
    availableCategories.forEach((item) => set.add(item));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [availableCategories]);

  const renderProvider = ({ item }: { item: NormalizedProvider }) => {
    const distanceKm = userLocation
      ? haversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.latitude,
          item.longitude
        )
      : null;
    const distanceText = distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—';

    return (
      <Animated.View
        style={[styles.providerCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.providerHeader}>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{item.name}</Text>
            <Text style={styles.providerCategory}>{item.category}</Text>
          </View>
          <View style={styles.providerStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: item.status === 'available' ? '#4CAF50' : item.status === 'busy' ? '#FF9800' : '#B0BEC5' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.status === 'available' ? '#4CAF50' : item.status === 'busy' ? '#FF9800' : '#607D8B' },
              ]}
            >
              {item.status === 'available' ? 'Online' : item.status === 'busy' ? 'Em serviço' : 'Offline'}
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

        <Text style={styles.providerDescription} numberOfLines={2}>
          {item.description || 'Sem descrição disponível.'}
        </Text>
      </Animated.View>
    );
  };
  const canPayNow = !!currentRequest && ['accepted','in_progress','near_client','started'].includes(currentRequest.status);
  const handlePayNow = async () => {
    if (!currentRequest) return;
    const ok = await startPayment(Math.round(currentRequest.price * 100), { request_id: currentRequest.id });
    if (ok) {
      Alert.alert('Pagamento concluído', 'Seu pagamento foi processado com sucesso.');
    } else {
      Alert.alert('Pagamento não concluído', 'Tente novamente ou use outro método.');
    }
  };

  const renderStars = () =>
    Array.from({ length: 5 }, (_, i) => (
      <TouchableOpacity key={i} onPress={() => setRating(i + 1)} style={styles.starButton}>
        <Ionicons name={i < rating ? 'star' : 'star-outline'} size={30} color="#FFD700" />
      </TouchableOpacity>
    ));

  if (showMap && currentRequest && userLocation) {
    const providerPoint = currentRequest.provider_latitude && currentRequest.provider_longitude
      ? { latitude: currentRequest.provider_latitude, longitude: currentRequest.provider_longitude }
      : assignedProvider
        ? { latitude: assignedProvider.latitude, longitude: assignedProvider.longitude }
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
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton
          onRouteReady={({ distanceKm, durationMin }) => {
            if (!currentRequest?.estimated_time && durationMin) {
              setCurrentRequest((prev) => (prev ? { ...prev, estimated_time: durationMin } : prev));
            }
            if (!statusMessage && distanceKm && durationMin) {
              setStatusMessage(`🚗 Prestador a ${distanceKm.toFixed(1)} km (${durationMin} min)`);
            }
          }}
        />

        <View style={styles.statusContainer}>
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          <View style={styles.requestInfo}>
            <Text style={styles.providerNameText}>
              {assignedProvider ? assignedProvider.name : 'Prestador em seleção'}
            </Text>
            <Text style={styles.serviceDetails}>
              {currentRequest.category} - R$ {currentRequest.price.toFixed(2)}
            </Text>
            {assignedProvider && (
              <Text style={styles.providerCategoryText}>{assignedProvider.category}</Text>
            )}
            {currentRequest.estimated_time != null && (
              <Text style={styles.estimatedTime}>Chegada em {currentRequest.estimated_time} minutos</Text>
            )}
          </View>
        </View>

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
                multiline
                numberOfLines={3}
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

  const hasActiveRequest = !!currentRequest && currentRequest.status !== 'completed';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header estilo Uber */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Olá, {user?.name}! 👋</Text>
              <Text style={styles.subtitle}>Onde você precisa de ajuda?</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={logout}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Status de conexão discreto */}
        <View style={styles.connectionStatus}>
          <View style={[styles.socketIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
          <Text style={styles.socketText}>{isConnected ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      {currentRequest && (
        <View style={styles.activeRequestCard}>
          <View style={styles.activeRequestHeader}>
            <View style={styles.activeIcon}>
              <Ionicons name="briefcase-outline" size={22} color="#007AFF" />
            </View>
            <View style={styles.activeInfo}>
              <Text style={styles.activeTitle}>{currentRequest.category}</Text>
              <Text style={styles.activeStatus}>{statusMessage}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{currentRequest.status.toUpperCase()}</Text>
            </View>
          </View>

          {assignedProvider ? (
            <View style={styles.activeProvider}>
              <View style={styles.providerAvatar}>
                <Ionicons name="person" size={20} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.activeProviderName}>{assignedProvider.name}</Text>
                <Text style={styles.activeProviderCategory}>{assignedProvider.category}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.waitingProviderText}>
              Aguardando matching com o prestador ideal para você
            </Text>
          )}

          <View style={styles.activeFooter}>
            <View style={styles.infoChip}>
              <Ionicons name="cash-outline" size={16} color="#007AFF" />
              <Text style={styles.infoChipText}>R$ {currentRequest.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.trackButton} onPress={() => setShowMap(true)}>
              <Ionicons name="map-outline" size={20} color="#fff" />
              <Text style={styles.trackButtonText}>Acompanhar</Text>
            </TouchableOpacity>
            {canPayNow && (
              <TouchableOpacity style={styles.trackButton} onPress={handlePayNow}>
                <Ionicons name="card-outline" size={20} color="#fff" />
                <Text style={styles.trackButtonText}>Pagar agora</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Mapa principal estilo Uber */}
      <View style={styles.mapContainer}>
        <CustomMapView
          style={styles.map}
          origin={userLocation || undefined}
          destination={undefined}
          initialRegion={userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          } : undefined}
          showsUserLocation
          showsMyLocationButton
        />
        
        {/* Botão de localização */}
        <TouchableOpacity style={styles.locationButton} onPress={fetchCurrentLocation}>
          <Ionicons name="locate" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Lista de prestadores em overlay */}
      {loadingProviders ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Buscando prestadores próximos...</Text>
        </View>
      ) : (
        <View style={styles.providersOverlay}>
          <View style={styles.providersHeader}>
            <Text style={styles.sectionTitle}>
              {providers.length > 0 ? 'Prestadores próximos' : 'Nenhum prestador disponível'}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadProviders}>
              <Ionicons name="refresh" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={providers.slice(0, 3)} // Mostra apenas os 3 mais próximos
            keyExtractor={(item) => item.__cacheKey}
            renderItem={renderProvider}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Botão de solicitação flutuante estilo Uber */}
      <TouchableOpacity
        style={[styles.floatingRequestButton, hasActiveRequest && styles.floatingRequestButtonDisabled]}
        onPress={() => setShowRequestModal(true)}
        disabled={hasActiveRequest}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.requestModal}>
            <View style={styles.requestModalHeader}>
              <Text style={styles.requestModalTitle}>Nova solicitação</Text>
              <Text style={styles.requestModalSubtitle}>
                Informe o serviço desejado e encontraremos o melhor prestador para você.
              </Text>
            </View>

            <ScrollView
              style={styles.requestModalContent}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Categoria</Text>
              <View style={styles.chipsContainer}>
                {categoryOptions.map((category) => {
                  const selected = requestForm.category === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                      onPress={() => setRequestForm((prev) => ({ ...prev, category }))}
                    >
                      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Ex: Encanador, Eletricista, Limpeza..."
                value={requestForm.category}
                onChangeText={(text) => setRequestForm((prev) => ({ ...prev, category: text }))}
              />

              <Text style={styles.inputLabel}>Valor estimado</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Informe um valor aproximado"
                value={requestForm.price}
                onChangeText={(text) => setRequestForm((prev) => ({ ...prev, price: text }))}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Detalhes do serviço</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Conte brevemente o que precisa (opcional)"
                value={requestForm.description}
                onChangeText={(text) => setRequestForm((prev) => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />

              <View style={styles.locationBox}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <Text style={styles.locationText}>
                  {userLocation
                    ? `Lat: ${userLocation.latitude.toFixed(4)} | Lon: ${userLocation.longitude.toFixed(4)}`
                    : 'Localização não disponível'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshLocationButton}
                onPress={fetchCurrentLocation}
              >
                <Ionicons name="refresh" size={16} color="#007AFF" />
                <Text style={styles.refreshLocationText}>Atualizar localização</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowRequestModal(false);
                  setRequestLoading(false);
                }}
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
                  <Text style={styles.confirmButtonText}>Solicitar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              multiline
              numberOfLines={3}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  greeting: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#ccc', marginTop: 2 },
  headerActions: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  menuButton: { 
    padding: 8,
  },
  connectionStatus: { 
    flexDirection: 'row', 
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  socketIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  socketText: { fontSize: 12, color: '#ccc' },
  
  // Estilos do mapa
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Overlay de prestadores
  providersOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: 200,
  },
  providersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  horizontalList: {
    paddingHorizontal: 0,
  },
  
  // Botão flutuante
  floatingRequestButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#000',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingRequestButtonDisabled: {
    backgroundColor: '#666',
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666',
    textAlign: 'center',
  },
  
  emptyListText: { fontSize: 14, color: '#607D8B', textAlign: 'center', marginVertical: 20 },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  activeRequestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeRequestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  activeIcon: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 10,
    marginRight: 12,
  },
  activeInfo: { flex: 1 },
  activeTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  activeStatus: { fontSize: 14, color: '#007AFF', marginTop: 4 },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { color: '#007AFF', fontWeight: '600', fontSize: 12 },
  activeProvider: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeProviderName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  activeProviderCategory: { fontSize: 13, color: '#607D8B' },
  waitingProviderText: { fontSize: 14, color: '#607D8B', marginBottom: 12 },
  activeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  infoChipText: { marginLeft: 6, fontWeight: '600', color: '#1a1a1a' },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  trackButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  requestModal: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxHeight: height * 0.85 },
  requestModalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  requestModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  requestModalSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  requestModalContent: { paddingHorizontal: 20, paddingTop: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipSelected: { backgroundColor: '#E3F2FD', borderColor: '#007AFF' },
  categoryChipText: { color: '#4A5568', fontWeight: '500' },
  categoryChipTextSelected: { color: '#007AFF' },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  locationText: { marginLeft: 8, color: '#1a1a1a', flex: 1 },
  refreshLocationButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  refreshLocationText: { marginLeft: 6, color: '#007AFF', fontWeight: '600' },
  modalActions: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: { fontSize: 16, color: '#666', fontWeight: '500' },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
  },
  confirmButtonDisabled: { backgroundColor: '#9ec9ff' },
  confirmButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  ratingModal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, margin: 20, alignItems: 'center', width: '90%' },
  ratingTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  ratingSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  starsContainer: { flexDirection: 'row', marginBottom: 20 },
  starButton: { padding: 4, marginHorizontal: 4 },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 80,
  },
  ratingButtons: { flexDirection: 'row', width: '100%' },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
  },
  submitButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  
  // Map view styles
  mapHeader: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: { padding: 8, marginRight: 16 },
  mapTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff' },
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
  statusMessage: { fontSize: 16, fontWeight: '600', color: '#007AFF', textAlign: 'center', marginBottom: 12 },
  requestInfo: { alignItems: 'center' },
  providerNameText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  providerCategoryText: { fontSize: 14, color: '#607D8B', marginTop: 4 },
  serviceDetails: { fontSize: 14, color: '#666', marginTop: 4 },
  estimatedTime: { fontSize: 12, color: '#999', marginTop: 4 },
});
