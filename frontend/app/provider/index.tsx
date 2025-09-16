import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import axios from 'axios';

import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

// 🔽 mapa estilo Uber
import CustomMapView, { LatLng } from '@/components/CustomMapView';
import { PROVIDERS_API_URL, REQUESTS_API_URL } from '@/utils/config';
import { haversineDistance } from '@/utils/geo';

const { height } = Dimensions.get('window');

const PROVIDER_CATEGORIES = ['Encanador', 'Eletricista', 'Limpeza', 'Jardinagem', 'Pintura', 'Reformas'];

interface ProviderProfile {
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
}

interface RawServiceRequest {
  id: string;
  client_id: string;
  provider_id?: string;
  category: string;
  description?: string;
  price: number;
  status: string;
  client_latitude: number;
  client_longitude: number;
  created_at?: string;
  client_name?: string;
  client_phone?: string;
  client_address?: string;
}

type ServiceRequest = RawServiceRequest & { distance?: number };

const ACTIVE_STATUSES = ['accepted', 'in_progress', 'near_client', 'started'];
const OFFER_STATUSES = ['pending', 'offered'];

const formatId = (id: string) => {
  if (!id) return '—';
  return id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
};

const PROVIDER_SERVICE_CONFIG_ERROR =
  'Serviço de prestadores indisponível. Configure EXPO_PUBLIC_PROVIDER_SERVICE_URL ou o gateway com /api/providers.';

const REQUEST_SERVICE_CONFIG_ERROR =
  'Serviço de solicitações indisponível. Configure EXPO_PUBLIC_REQUEST_SERVICE_URL ou o gateway com /api/requests.';

export default function ProviderScreen() {
  const { user, token, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const activeRequestRef = useRef<ServiceRequest | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [setupForm, setSetupForm] = useState({
    name: user?.name || '',
    category: '',
    price: '',
    description: '',
  });
  const [setupLocation, setSetupLocation] = useState<LatLng | null>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);   // região inicial no mapa
  const [providerPos, setProviderPos] = useState<{ latitude: number; longitude: number; heading?: number } | null>(null); // posição animada do carro
  const providerPosRef = useRef<typeof providerPos>(null);

  const [statusMessage, setStatusMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const providerProfileRef = useRef<ProviderProfile | null>(null);
  const providerConfigAlertShown = useRef(false);
  const requestConfigAlertShown = useRef(false);


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!user || user.user_type !== 1) {
      setProfileLoading(false);
      return;
    }
    fetchProviderProfile();
  }, [fetchProviderProfile, user]);

  useEffect(() => {
    if (!providerProfile) {
      return;
    }
    loadRequests(providerProfile);
    getCurrentLocation(providerProfile);
  }, [getCurrentLocation, loadRequests, providerProfile]);

  useEffect(() => {
    const cleanup = setupSocketListeners();
    return () => {
      cleanup?.();
    };
  }, [setupSocketListeners]);

  useEffect(() => {
    return () => {
      locationWatcher.current?.remove?.();
    };
  }, []);

  useEffect(() => {
    providerPosRef.current = providerPos;
  }, [providerPos]);

  useEffect(() => {
    providerProfileRef.current = providerProfile;
  }, [providerProfile]);

  useEffect(() => {
    activeRequestRef.current = activeRequest;
  }, [activeRequest]);

  useEffect(() => {
    if (showSetupModal) {
      fetchSetupLocation();
    }
  }, [fetchSetupLocation, showSetupModal]);

  const fetchProviderProfile = useCallback(async () => {
    if (!user) {
      return;
    }
    setProfileLoading(true);
    if (!PROVIDERS_API_URL) {
      if (!providerConfigAlertShown.current) {
        Alert.alert('Configuração necessária', PROVIDER_SERVICE_CONFIG_ERROR);
        providerConfigAlertShown.current = true;
      }
      setProfileError(PROVIDER_SERVICE_CONFIG_ERROR);
      setProfileLoading(false);
      return;
    }
    try {
      const response = await axios.get(PROVIDERS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const providers: ProviderProfile[] = response.data;
      const profile = providers.find((prov) => prov.user_id === user.id);
      if (profile) {
        setProviderProfile(profile);
        setProfileError(null);
      } else {
        setProviderProfile(null);
        setProfileError('Nenhum cadastro de prestador encontrado.');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do prestador:', error);
      setProfileError('Não foi possível carregar os dados do prestador.');
      Alert.alert('Erro', 'Não foi possível carregar os dados do prestador.');
    } finally {
      setProfileLoading(false);
    }
  }, [token, user]);

  const fetchSetupLocation = useCallback(async (): Promise<LatLng | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para cadastrar o serviço.');
        return null;
      }
      const current = await Location.getCurrentPositionAsync({});
      const coords = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setSetupLocation(coords);
      return coords;
    } catch (error) {
      console.error('Erro ao obter localização inicial do prestador:', error);
      return null;
    }
  }, []);

  // ===== localização do prestador: pega atual, envia pro backend e mantém watcher (move o carro)
  const getCurrentLocation = useCallback(
    async (profile: ProviderProfile) => {
      if (!PROVIDERS_API_URL) {
        if (!providerConfigAlertShown.current) {
          Alert.alert('Configuração necessária', PROVIDER_SERVICE_CONFIG_ERROR);
          providerConfigAlertShown.current = true;
        }
        return;
      }
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
          heading: current.coords.heading ?? 0,
        };

        providerPosRef.current = start;
        setUserLocation({ ...start, latitudeDelta: 0.05, longitudeDelta: 0.05 } as any);
        setProviderPos(start);

        locationWatcher.current?.remove?.();

        await axios.put(
          `${PROVIDERS_API_URL}/${profile.id}/location`,
          { latitude: start.latitude, longitude: start.longitude },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1500,
            distanceInterval: 5,
          },
          async (loc) => {
            const previous = providerPosRef.current ?? {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading ?? 0,
            };

            const headingValue =
              loc.coords.heading ??
              bearing(previous.latitude, previous.longitude, loc.coords.latitude, loc.coords.longitude);

            const next = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: headingValue,
            };

            providerPosRef.current = next;
            setProviderPos(next);

            setRequests((prev) =>
              prev.map((req) => ({
                ...req,
                distance: haversineDistance(next.latitude, next.longitude, req.client_latitude, req.client_longitude),
              }))
            );
            setActiveRequest((prev) =>
              prev
                ? {
                    ...prev,
                    distance: haversineDistance(
                      next.latitude,
                      next.longitude,
                      prev.client_latitude,
                      prev.client_longitude
                    ),
                  }
                : null
            );

            try {
              await axios.put(
                `${PROVIDERS_API_URL}/${profile.id}/location`,
                { latitude: next.latitude, longitude: next.longitude },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch {
              // silencioso: falhas offline serão sincronizadas posteriormente
            }
          }
        );

        locationWatcher.current = watcher;
      } catch (error) {
        console.error('Erro ao obter localização:', error);
      }
    },
    [token]
  );

  const handleOpenSetupModal = useCallback(() => {
    setSetupForm({
      name: user?.name || '',
      category: '',
      price: '',
      description: '',
    });
    setSetupLocation(null);
    setShowSetupModal(true);
  }, [user]);

  const handleCloseSetupModal = useCallback(() => {
    setShowSetupModal(false);
    setSetupLoading(false);
  }, []);

  const handleCreateProviderProfile = useCallback(async () => {
    if (!user) {
      return;
    }
    if (!PROVIDERS_API_URL) {
      if (!providerConfigAlertShown.current) {
        Alert.alert('Configuração necessária', PROVIDER_SERVICE_CONFIG_ERROR);
        providerConfigAlertShown.current = true;
      }
      return;
    }

    const name = setupForm.name.trim();
    const category = setupForm.category.trim();
    const priceValue = Number(setupForm.price.replace(',', '.'));

    if (!name || !category) {
      Alert.alert('Atenção', 'Informe nome e categoria do serviço.');
      return;
    }

    if (Number.isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Atenção', 'Informe um valor médio válido.');
      return;
    }

    const location = setupLocation ?? (await fetchSetupLocation());
    if (!location) {
      Alert.alert('Localização necessária', 'Não foi possível obter a localização atual.');
      return;
    }

    const payload: ProviderProfile = {
      id: `prov-${user.id}`,
      name,
      category,
      price: priceValue,
      description: setupForm.description.trim() || `Serviços de ${category}`,
      latitude: location.latitude,
      longitude: location.longitude,
      status: 'available',
      rating: 5,
      user_id: user.id,
    };

    setSetupLoading(true);
    try {
      const response = await axios.post(PROVIDERS_API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created: ProviderProfile = response.data ?? payload;
      setProviderProfile(created);
      setProfileError(null);
      Alert.alert('Sucesso', 'Perfil de prestador criado com sucesso!');
      setShowSetupModal(false);
    } catch (error) {
      console.error('Erro ao criar perfil do prestador:', error);
      Alert.alert('Erro', 'Não foi possível criar o perfil de prestador.');
    } finally {
      setSetupLoading(false);
    }
  }, [fetchSetupLocation, providerConfigAlertShown, setupForm, setupLocation, token, user]);

  // ===== sockets (notificações de novas solicitações/cancelamentos)
  const setupSocketListeners = useCallback(() => {
    if (!socket) {
      return undefined;
    }

    const handleNewRequest = (data: any) => {
      const profile = providerProfileRef.current;
      if (profile && data?.provider_id && data.provider_id !== profile.id) {
        return;
      }
      loadRequests(profile ?? undefined);
      const clientLabel = data?.client_name ?? data?.client_id ?? 'Cliente';
      Alert.alert(
        '🔔 Nova Solicitação!',
        `Cliente: ${clientLabel}\nServiço: ${data?.category ?? 'n/d'}\nValor: R$ ${data?.price ?? 'n/d'}`,
        [{ text: 'OK' }]
      );
    };

    const handleRequestCancelled = (data: any) => {
      const profile = providerProfileRef.current;
      if (profile && data?.provider_id && data.provider_id !== profile.id) {
        return;
      }
      loadRequests(profile ?? undefined);
      const currentActive = activeRequestRef.current;
      if (currentActive && data?.request_id && currentActive.id === data.request_id) {
        setActiveRequest(null);
        setShowMap(false);
        Alert.alert('Solicitação Cancelada', 'O cliente cancelou a solicitação.');
      }
    };

    socket.off('new_request', handleNewRequest);
    socket.off('request_cancelled', handleRequestCancelled);
    socket.on('new_request', handleNewRequest);
    socket.on('request_cancelled', handleRequestCancelled);

    return () => {
      socket.off('new_request', handleNewRequest);
      socket.off('request_cancelled', handleRequestCancelled);
    };
  }, [loadRequests, socket]);

  const loadRequests = useCallback(
    async (profileOverride?: ProviderProfile) => {
      const currentProfile = profileOverride ?? providerProfileRef.current;
      if (!currentProfile) {
        return;
      }

      if (!REQUESTS_API_URL) {
        if (!requestConfigAlertShown.current) {
          Alert.alert('Configuração necessária', REQUEST_SERVICE_CONFIG_ERROR);
          requestConfigAlertShown.current = true;
        }
        setLoading(false);
        setRequests([]);
        setActiveRequest(null);
        setStatusMessage('');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(REQUESTS_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allRequests: RawServiceRequest[] = response.data;
        const targeted = allRequests.filter((req) => req.provider_id === currentProfile.id);

        const baseLat = providerPosRef.current?.latitude ?? currentProfile.latitude;
        const baseLon = providerPosRef.current?.longitude ?? currentProfile.longitude;

        const pendingRequests = targeted
          .filter((req) => OFFER_STATUSES.includes(req.status))
          .map((req) => ({
            ...req,
            distance:
              baseLat != null && baseLon != null
                ? haversineDistance(baseLat, baseLon, req.client_latitude, req.client_longitude)
                : undefined,
          }));

        const activeReq = targeted.find((req) => ACTIVE_STATUSES.includes(req.status));

        setRequests(pendingRequests);

        let shouldCloseModal = false;
        setSelectedRequest((prevSelected) => {
          if (prevSelected && !pendingRequests.some((req) => req.id === prevSelected.id)) {
            shouldCloseModal = true;
            return null;
          }
          return prevSelected;
        });
        if (shouldCloseModal) {
          setShowModal(false);
        }

        if (activeReq) {
          const activeWithDistance: ServiceRequest = {
            ...activeReq,
            distance:
              baseLat != null && baseLon != null
                ? haversineDistance(baseLat, baseLon, activeReq.client_latitude, activeReq.client_longitude)
                : undefined,
          };
          setActiveRequest(activeWithDistance);
          updateStatusMessage(activeReq.status);
        } else {
          setActiveRequest(null);
          setStatusMessage('');
        }
      } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        Alert.alert('Erro', 'Não foi possível carregar as solicitações');
      } finally {
        setLoading(false);
      }
    },
    [token, updateStatusMessage]
  );

  const updateStatusMessage = useCallback((status: string) => {
    switch (status) {
      case 'offered':
        setStatusMessage('📬 Solicitação disponível para aceite');
        break;
      case 'pending':
        setStatusMessage('⏳ Aguardando confirmação');
        break;
      case 'accepted':
        setStatusMessage('📍 Dirija-se ao cliente');
        break;
      case 'in_progress':
        setStatusMessage('🚗 A caminho do cliente');
        break;
      case 'near_client':
        setStatusMessage('📍 Você chegou! Clique para iniciar o serviço');
        break;
      case 'started':
        setStatusMessage('🔧 Serviço em andamento');
        break;
      default:
        setStatusMessage('');
        break;
    }
  }, []);

  const updateProviderStatus = useCallback(
    async (status: string) => {
      const profile = providerProfileRef.current;
      if (!profile) {
        return;
      }
      if (!PROVIDERS_API_URL) {
        if (!providerConfigAlertShown.current) {
          Alert.alert('Configuração necessária', PROVIDER_SERVICE_CONFIG_ERROR);
          providerConfigAlertShown.current = true;
        }
        return;
      }
      try {
        setStatusUpdating(true);
        await axios.put(
          `${PROVIDERS_API_URL}/${profile.id}/status`,
          { status },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProviderProfile((prev) => (prev ? { ...prev, status } : prev));
      } catch (error) {
        console.error('Erro ao atualizar status do prestador:', error);
      } finally {
        setStatusUpdating(false);
      }
    },
    [token]
  );

  const handleToggleAvailability = useCallback(() => {
    const profile = providerProfileRef.current;
    if (!profile) {
      return;
    }
    if (profile.status === 'busy') {
      Alert.alert('Atenção', 'Finalize o serviço atual antes de alterar a disponibilidade.');
      return;
    }
    const nextStatus = profile.status === 'available' ? 'offline' : 'available';
    updateProviderStatus(nextStatus);
  }, [updateProviderStatus]);

  const handleRequestSelect = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest || !providerProfile) return;
    if (!REQUESTS_API_URL) {
      if (!requestConfigAlertShown.current) {
        Alert.alert('Configuração necessária', REQUEST_SERVICE_CONFIG_ERROR);
        requestConfigAlertShown.current = true;
      }
      return;
    }
    try {
      await axios.put(
        `${REQUESTS_API_URL}/${selectedRequest.id}/accept`,
        { provider_id: providerProfile.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const acceptedRequest: ServiceRequest = { ...selectedRequest, status: 'accepted' };
      setActiveRequest(acceptedRequest);
      setShowModal(false);
      setSelectedRequest(null);
      setShowMap(true);
      setStatusMessage('📍 Dirija-se ao cliente');
      setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
      updateProviderStatus('busy');
      Alert.alert('Sucesso', 'Solicitação aceita! Dirija-se ao cliente.');
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeRequest) return;
    if (!REQUESTS_API_URL) {
      if (!requestConfigAlertShown.current) {
        Alert.alert('Configuração necessária', REQUEST_SERVICE_CONFIG_ERROR);
        requestConfigAlertShown.current = true;
      }
      return;
    }
    try {
      await axios.put(
        `${REQUESTS_API_URL}/${activeRequest.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
      updateStatusMessage(newStatus);

      if (newStatus === 'completed') {
        updateProviderStatus('available');
        setShowMap(false);
        setStatusMessage('✅ Serviço concluído!');
        setActiveRequest(null);
        loadRequests(providerProfile ?? undefined);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const handleStartService = () => {
    Alert.alert('Iniciar Serviço', 'Você chegou ao local do cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, iniciar', onPress: () => handleStatusUpdate('started') },
    ]);
  };

  const handleCompleteService = () => {
    Alert.alert('Concluir Serviço', 'Deseja marcar o serviço como concluído?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Concluir', onPress: () => handleStatusUpdate('completed') },
    ]);
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando dados do prestador...</Text>
      </View>
    );
  }

  if (!providerProfile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <View style={styles.emptyContainer}>
          <Ionicons name="construct-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>Cadastre seu perfil de prestador</Text>
          <Text style={styles.emptySubtitle}>
            {profileError || 'Finalize o cadastro de prestador para receber solicitações.'}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleOpenSetupModal}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Criar perfil de serviço</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trackButton} onPress={fetchProviderProfile}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.trackButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderRequest = ({ item }: { item: ServiceRequest }) => {
    const distanceText = item.distance != null ? `${item.distance.toFixed(1)} km` : '—';
    const coordinatesText = `Lat: ${item.client_latitude.toFixed(4)} • Lon: ${item.client_longitude.toFixed(4)}`;

    return (
      <Animated.View style={[styles.requestCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity onPress={() => handleRequestSelect(item)}>
          <View style={styles.requestHeader}>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>Solicitação {formatId(item.id)}</Text>
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
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>

            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.timeText}>Status: {item.status}</Text>
            </View>
          </View>

          <Text style={styles.requestDescription} numberOfLines={2}>
            {item.description || 'Sem descrição fornecida.'}
          </Text>
          <Text style={styles.clientAddress} numberOfLines={1}>📍 {coordinatesText}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ===== Tela do mapa (serviço ativo)
  if (showMap && activeRequest) {
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
            <Text style={styles.clientName}>Solicitação {formatId(activeRequest.id)}</Text>
            <Text style={styles.serviceDetails}>
              {activeRequest.category} - R$ {activeRequest.price.toFixed(2)}
            </Text>
            <Text style={styles.clientPhone}>Cliente: {formatId(activeRequest.client_id)}</Text>
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
          {providerProfile && (
            <TouchableOpacity
              style={[
                styles.availabilityButton,
                (statusUpdating || providerProfile.status === 'busy') && styles.availabilityButtonDisabled,
              ]}
              onPress={handleToggleAvailability}
              disabled={statusUpdating || providerProfile.status === 'busy'}
            >
              <View
                style={[
                  styles.availabilityIndicator,
                  {
                    backgroundColor:
                      providerProfile.status === 'available'
                        ? '#4CAF50'
                        : providerProfile.status === 'busy'
                        ? '#FF9800'
                        : '#9E9E9E',
                  },
                ]}
              />
              <Text style={styles.availabilityText}>
                {statusUpdating
                  ? 'Atualizando...'
                  : providerProfile.status === 'available'
                  ? 'Disponível'
                  : providerProfile.status === 'busy'
                  ? 'Em serviço'
                  : 'Offline'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {activeRequest && (
        <TouchableOpacity style={styles.activeRequestBanner} onPress={() => setShowMap(true)}>
          <Ionicons name="construct-outline" size={20} color="#007AFF" />
          <Text style={styles.activeRequestText}>Serviço ativo - {activeRequest.category}</Text>
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
                    <Text style={styles.clientName}>{formatId(selectedRequest.client_id)}</Text>
                    <Text style={styles.clientPhone}>ID completo: {selectedRequest.client_id}</Text>
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

                    <View style={styles.detailItem}>
                      <Ionicons name="location-outline" size={20} color="#666" />
                      <Text style={styles.detailLabel}>Distância</Text>
                      <Text style={styles.detailValue}>{selectedRequest.distance != null ? `${selectedRequest.distance.toFixed(1)} km` : '—'}</Text>
                    </View>
                  </View>

                  <Text style={styles.addressLabel}>Local do cliente</Text>
                  <Text style={styles.addressText}>Lat: {selectedRequest.client_latitude.toFixed(4)}
Lon: {selectedRequest.client_longitude.toFixed(4)}</Text>
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

      <Modal visible={showSetupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.setupModal}>
            <View style={styles.setupHeader}>
              <Text style={styles.setupTitle}>Cadastrar perfil de serviço</Text>
              <TouchableOpacity onPress={handleCloseSetupModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.setupContent}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.setupLabel}>Nome do prestador</Text>
              <TextInput
                style={styles.setupInput}
                placeholder="Seu nome"
                value={setupForm.name}
                onChangeText={(text) => setSetupForm((prev) => ({ ...prev, name: text }))}
              />

              <Text style={styles.setupLabel}>Categoria</Text>
              <View style={styles.setupChipsContainer}>
                {PROVIDER_CATEGORIES.map((category) => {
                  const selected = setupForm.category === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.setupChip, selected && styles.setupChipSelected]}
                      onPress={() => setSetupForm((prev) => ({ ...prev, category }))}
                    >
                      <Text style={[styles.setupChipText, selected && styles.setupChipTextSelected]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.setupInput}
                placeholder="Ex: Encanador, Eletricista, Limpeza..."
                value={setupForm.category}
                onChangeText={(text) => setSetupForm((prev) => ({ ...prev, category: text }))}
              />

              <Text style={styles.setupLabel}>Valor médio (R$)</Text>
              <TextInput
                style={styles.setupInput}
                placeholder="Informe um valor de referência"
                keyboardType="numeric"
                value={setupForm.price}
                onChangeText={(text) => setSetupForm((prev) => ({ ...prev, price: text }))}
              />

              <Text style={styles.setupLabel}>Descrição</Text>
              <TextInput
                style={styles.setupTextArea}
                placeholder="Conte um pouco sobre o seu serviço"
                value={setupForm.description}
                onChangeText={(text) => setSetupForm((prev) => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />

              <View style={styles.setupLocationBox}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <Text style={styles.setupLocationText}>
                  {setupLocation
                    ? `Lat: ${setupLocation.latitude.toFixed(4)} | Lon: ${setupLocation.longitude.toFixed(4)}`
                    : 'Localização não disponível'}
                </Text>
              </View>

              <TouchableOpacity style={styles.setupLocationButton} onPress={fetchSetupLocation}>
                <Ionicons name="refresh" size={16} color="#007AFF" />
                <Text style={styles.setupLocationButtonText}>Atualizar localização</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseSetupModal}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, setupLoading && styles.confirmButtonDisabled]}
                onPress={handleCreateProviderProfile}
                disabled={setupLoading}
              >
                {setupLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Cadastrar</Text>
                )}
              </TouchableOpacity>
            </View>
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
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  availabilityButtonDisabled: { opacity: 0.6 },
  availabilityIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  availabilityText: { color: '#fff', fontWeight: '600', fontSize: 12 },
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  trackButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },

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
  setupModal: { backgroundColor: '#fff', borderRadius: 20, margin: 20, maxHeight: height * 0.85, width: '100%' },
  setupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  setupTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  setupContent: { paddingHorizontal: 20, paddingTop: 10 },
  setupLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, marginTop: 12 },
  setupInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
  },
  setupTextArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  setupChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  setupChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  setupChipSelected: { backgroundColor: '#E3F2FD', borderColor: '#007AFF' },
  setupChipText: { color: '#4A5568', fontWeight: '500' },
  setupChipTextSelected: { color: '#007AFF' },
  setupLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  setupLocationText: { marginLeft: 8, color: '#1a1a1a', flex: 1 },
  setupLocationButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  setupLocationButtonText: { marginLeft: 6, color: '#007AFF', fontWeight: '600' },
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
