import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useFirebaseRealtime } from './FirebaseRealtimeContext';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/config';

// Estados do fluxo estilo Uber
export type RequestStatus = 
  | 'searching'      // Cliente procurando prestador
  | 'offered'        // Prestador encontrado, aguardando aceitação
  | 'accepted'       // Prestador aceitou, indo até o cliente
  | 'arrived'        // Prestador chegou no local do cliente
  | 'in_progress'    // Serviço em andamento
  | 'completed'      // Serviço concluído
  | 'cancelled'      // Cancelado por qualquer uma das partes
  | 'timeout';       // Timeout na busca

export interface ServiceRequest {
  id: string;
  client_id: string;
  provider_id?: string;
  category: string;
  description: string;
  client_latitude: number;
  client_longitude: number;
  price: number;
  status: RequestStatus;
  created_at?: string;
  updated_at?: string;
  estimated_arrival?: string;
  provider_location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Provider {
  id: string;
  name: string;
  category: string;
  rating: number;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline';
  distance?: number;
}

interface MatchingContextType {
  // Estado atual
  currentRequest: ServiceRequest | null;
  assignedProvider: Provider | null;
  searchingProviders: boolean;
  
  // Ações do cliente
  requestService: (params: {
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    price: number;
  }) => Promise<void>;
  
  cancelRequest: () => Promise<void>;
  completeService: (rating: number, comment?: string) => Promise<void>;
  
  // Ações do prestador
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
  markArrived: () => Promise<void>;
  startService: () => Promise<void>;
  finishService: () => Promise<void>;
  
  // Estado da conexão
  isConnected: boolean;
}

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export const useMatching = () => {
  const context = useContext(MatchingContext);
  if (!context) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};

export const MatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, getAuthHeaders, validateToken, refreshAuth } = useAuth();
  const { isConnected, sendMessage, joinRoom, leaveRoom } = useFirebaseRealtime();
  
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [assignedProvider, setAssignedProvider] = useState<Provider | null>(null);
  const [searchingProviders, setSearchingProviders] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper para fazer requisições autenticadas com validação de token
  const makeAuthenticatedRequest = async (requestFn: () => Promise<any>) => {
    try {
      // Primeiro, validar o token
      const isTokenValid = await validateToken();
      if (!isTokenValid) {
        console.warn('⚠️ [MATCHING] Token inválido, tentando refresh...');
        await refreshAuth();
        // Se ainda não tiver token válido após refresh, falhar
        if (!user) {
          throw new Error('Usuário não autenticado');
        }
      }

      return await requestFn();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('🔒 [MATCHING] Erro 401, tentando refresh da autenticação...');
        await refreshAuth();
        // Tentar novamente após refresh
        return await requestFn();
      }
      throw error;
    }
  };

  // Buscar solicitação ativa ao inicializar
  const loadActiveRequest = useCallback(async () => {
    if (!user) return;

    try {
      const response = await makeAuthenticatedRequest(() =>
        axios.get(`${API_BASE_URL}/requests`, {
          headers: getAuthHeaders(),
        })
      );

      const requests: ServiceRequest[] = response.data;
      console.log('🔍 [MATCHING] Buscando solicitação ativa para user:', user.id, 'type:', user.user_type);
      console.log('🔍 [MATCHING] Total de requests encontradas:', requests.length);

      // Para prestadores, buscar por provider_id E status ativo
      // Para clientes, buscar por client_id E status ativo
      const activeRequest = requests.find(req => {
        let isForUser = false;

        if (user.user_type === 2) {
          // Cliente: buscar por client_id
          isForUser = req.client_id === user.id;
        } else if (user.user_type === 1) {
          // Prestador: buscar por provider_id (que pode ter sufixo da categoria)
          isForUser = req.provider_id && req.provider_id.startsWith(user.id);
        }

        const isActive = !['completed', 'cancelled'].includes(req.status);

        console.log('🔍 [MATCHING] Verificando request:', req.id, {
          client_id: req.client_id,
          provider_id: req.provider_id,
          status: req.status,
          isForUser,
          isActive
        });

        return isForUser && isActive;
      });

      if (activeRequest) {
        console.log('✅ [MATCHING] Solicitação ativa encontrada:', activeRequest.id, 'status:', activeRequest.status);
        setCurrentRequest(activeRequest);
        joinRoom(`request_${activeRequest.id}`);

        // Se for cliente e tem provider_id, buscar dados do prestador
        if (user.user_type === 2 && activeRequest.provider_id) {
          loadProviderData(activeRequest.provider_id);
        }
      } else {
        console.log('ℹ️ [MATCHING] Nenhuma solicitação ativa encontrada');
        setCurrentRequest(null);
      }
    } catch (error) {
      console.error('❌ [MATCHING] Erro ao carregar solicitação ativa:', error);
    }
  }, [user, getAuthHeaders, joinRoom, makeAuthenticatedRequest]);

  const loadProviderData = useCallback(async (providerId: string) => {
    try {
      const response = await makeAuthenticatedRequest(() =>
        axios.get(`${API_BASE_URL}/providers/${providerId}`, {
          headers: getAuthHeaders(),
        })
      );
      setAssignedProvider(response.data);
    } catch (error) {
      console.error('❌ [MATCHING] Erro ao carregar dados do prestador:', error);
    }
  }, [getAuthHeaders, makeAuthenticatedRequest]);

  // Solicitar serviço (Cliente)
  const requestService = useCallback(async (params: {
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    price: number;
  }) => {
    if (!user || user.user_type !== 2) return;
    
    try {
      setSearchingProviders(true);
      
      // Gerar ID único para a solicitação
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const requestPayload = {
        id: requestId,
        client_id: user.id,
        category: params.category,
        description: params.description,
        client_latitude: Number(params.latitude),
        client_longitude: Number(params.longitude),
        price: Number(params.price),
      };

      console.log('🔍 [MATCHING] Enviando payload:', JSON.stringify(requestPayload, null, 2));

      const response = await makeAuthenticatedRequest(() =>
        axios.post(`${API_BASE_URL}/requests`, requestPayload, {
          headers: getAuthHeaders(),
        })
      );
      
      const newRequest: ServiceRequest = response.data;
      setCurrentRequest(newRequest);
      joinRoom(`request_${newRequest.id}`);
      
      // Timeout para busca (2 minutos)
      searchTimeoutRef.current = setTimeout(() => {
        if (currentRequest?.status === 'searching') {
          handleSearchTimeout();
        }
      }, 120000);
      
      Alert.alert('🔍 Procurando prestador', 'Aguarde enquanto encontramos o melhor prestador para você...');
      
    } catch (error: any) {
      console.error('❌ [MATCHING] Erro ao solicitar serviço:', error);

      // Log detalhado do erro
      if (error.response) {
        console.error('❌ [MATCHING] Status:', error.response.status);
        console.error('❌ [MATCHING] Data:', error.response.data);
        console.error('❌ [MATCHING] Headers:', error.response.headers);
      }

      setSearchingProviders(false);

      // Mensagem de erro mais específica
      let errorMessage = 'Não foi possível solicitar o serviço. Tente novamente.';
      if (error.response?.status === 422) {
        errorMessage = 'Dados inválidos na solicitação. Verifique os campos e tente novamente.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Erro de autenticação. Faça login novamente.';
      }

      Alert.alert('Erro', errorMessage);
    }
  }, [user, getAuthHeaders, joinRoom, currentRequest, makeAuthenticatedRequest]);

  // Cancelar solicitação
  const cancelRequest = useCallback(async () => {
    if (!currentRequest) return;
    
    try {
      await axios.patch(`${API_BASE_URL}/requests/${currentRequest.id}`, {
        status: 'cancelled',
      }, {
        headers: getAuthHeaders(),
      });
      
      leaveRoom(`request_${currentRequest.id}`);
      setCurrentRequest(null);
      setAssignedProvider(null);
      setSearchingProviders(false);
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      
    } catch (error) {
      console.error('❌ [MATCHING] Erro ao cancelar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível cancelar a solicitação.');
    }
  }, [currentRequest, getAuthHeaders, leaveRoom]);

  // Aceitar solicitação (Prestador)
  const acceptRequest = useCallback(async (requestId: string) => {
    if (!user || user.user_type !== 1) return;

    try {
      console.log('✅ [MATCHING] Aceitando solicitação:', requestId);

      const response = await makeAuthenticatedRequest(() =>
        axios.post(`${API_BASE_URL}/requests/${requestId}/accept`, {
          provider_id: `${user.id}_${currentRequest?.category || 'Servico'}`,
        }, {
          headers: getAuthHeaders(),
        })
      );

      console.log('✅ [MATCHING] Solicitação aceita com sucesso:', response.data);

      // Atualizar status local
      setCurrentRequest(prev => prev ? { ...prev, provider_id: user.id, status: 'accepted' } : null);
      joinRoom(`request_${requestId}`);

      Alert.alert('✅ Solicitação aceita', 'Dirija-se ao local do cliente.');

    } catch (error) {
      console.error('❌ [MATCHING] Erro ao aceitar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação.');
    }
  }, [user, currentRequest, getAuthHeaders, joinRoom, makeAuthenticatedRequest]);

  // Rejeitar solicitação (Prestador)
  const rejectRequest = useCallback(async (requestId: string) => {
    if (!user || user.user_type !== 1) return;

    try {
      console.log('❌ [MATCHING] Recusando solicitação:', requestId);

      const response = await makeAuthenticatedRequest(() =>
        axios.post(`${API_BASE_URL}/requests/${requestId}/decline`, {
          provider_id: `${user.id}_${currentRequest?.category || 'Servico'}`,
          reason: 'Prestador não disponível no momento'
        }, {
          headers: getAuthHeaders(),
        })
      );

      console.log('❌ [MATCHING] Solicitação recusada:', response.data);

      // Limpar solicitação atual
      setCurrentRequest(null);

      Alert.alert('Solicitação recusada', 'A solicitação foi recusada.');

    } catch (error) {
      console.error('❌ [MATCHING] Erro ao rejeitar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível recusar a solicitação.');
    }
  }, [user, currentRequest, getAuthHeaders, makeAuthenticatedRequest]);

  // Atualizar localização (Prestador)
  const updateLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!user || user.user_type !== 1 || !currentRequest) return;
    
    try {
      await axios.patch(`${API_BASE_URL}/providers/${user.id}/location`, {
        latitude,
        longitude,
      }, {
        headers: getAuthHeaders(),
      });
      
      // Enviar atualização via WebSocket
      sendMessage('location_update', {
        request_id: currentRequest.id,
        provider_id: user.id,
        latitude,
        longitude,
      });
      
    } catch (error) {
      console.error('❌ [MATCHING] Erro ao atualizar localização:', error);
    }
  }, [user, currentRequest, getAuthHeaders, sendMessage]);

  // Marcar chegada (Prestador)
  const markArrived = useCallback(async () => {
    if (!currentRequest) return;

    try {
      await axios.put(`${API_BASE_URL}/requests/${currentRequest.id}/status`, {
        status: 'arrived',
      }, {
        headers: getAuthHeaders(),
      });

      setCurrentRequest(prev => prev ? { ...prev, status: 'arrived' } : null);

    } catch (error) {
      console.error('❌ [MATCHING] Erro ao marcar chegada:', error);
    }
  }, [currentRequest, getAuthHeaders]);

  // Iniciar serviço (Prestador)
  const startService = useCallback(async () => {
    if (!currentRequest) return;

    try {
      await axios.put(`${API_BASE_URL}/requests/${currentRequest.id}/status`, {
        status: 'in_progress',
      }, {
        headers: getAuthHeaders(),
      });

      setCurrentRequest(prev => prev ? { ...prev, status: 'in_progress' } : null);

    } catch (error) {
      console.error('❌ [MATCHING] Erro ao iniciar serviço:', error);
    }
  }, [currentRequest, getAuthHeaders]);

  // Finalizar serviço (Prestador)
  const finishService = useCallback(async () => {
    if (!currentRequest) return;

    try {
      await axios.put(`${API_BASE_URL}/requests/${currentRequest.id}/status`, {
        status: 'completed',
      }, {
        headers: getAuthHeaders(),
      });

      setCurrentRequest(prev => prev ? { ...prev, status: 'completed' } : null);

    } catch (error) {
      console.error('❌ [MATCHING] Erro ao finalizar serviço:', error);
    }
  }, [currentRequest, getAuthHeaders]);

  // Completar serviço com avaliação (Cliente)
  const completeService = useCallback(async (rating: number, comment?: string) => {
    if (!currentRequest) return;
    
    try {
      await axios.post(`${API_BASE_URL}/requests/${currentRequest.id}/rating`, {
        rating,
        comment,
      }, {
        headers: getAuthHeaders(),
      });
      
      leaveRoom(`request_${currentRequest.id}`);
      setCurrentRequest(null);
      setAssignedProvider(null);
      
      Alert.alert('✅ Serviço avaliado', 'Obrigado pela sua avaliação!');
      
    } catch (error) {
      console.error('❌ [MATCHING] Erro ao avaliar serviço:', error);
    }
  }, [currentRequest, getAuthHeaders, leaveRoom]);

  // Timeout na busca
  const handleSearchTimeout = useCallback(() => {
    setSearchingProviders(false);
    setCurrentRequest(prev => prev ? { ...prev, status: 'timeout' } : null);
    Alert.alert(
      '⏰ Timeout na busca',
      'Não encontramos prestadores disponíveis no momento. Tente novamente mais tarde.',
      [{ text: 'OK', onPress: () => setCurrentRequest(null) }]
    );
  }, []);

  // Handlers para eventos em tempo real
  const handleRealtimeMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'new_request':
        // Prestador recebe nova solicitação
        if (user?.user_type === 1) {
          Alert.alert(
            '🔔 Nova Solicitação!',
            `${data.category} - R$ ${data.price}\n${data.description}`,
            [
              { text: 'Recusar', style: 'cancel' },
              { text: 'Ver Detalhes', onPress: () => {
                // Mostrar modal com detalhes da solicitação
                console.log('Mostrar detalhes da solicitação:', data);
              }},
            ]
          );
        }
        break;

      case 'provider_found':
        // Cliente recebe notificação de prestador encontrado
        if (user?.user_type === 2 && data.request_id === currentRequest?.id) {
          setCurrentRequest(prev => prev ? { ...prev, status: 'offered', provider_id: data.provider_id } : null);
          loadProviderData(data.provider_id);
          setSearchingProviders(false);
        }
        break;

      case 'request_accepted':
        // Cliente recebe confirmação de aceitação
        if (user?.user_type === 2 && data.request_id === currentRequest?.id) {
          setCurrentRequest(prev => prev ? { ...prev, status: 'accepted' } : null);
          Alert.alert('✅ Solicitação Aceita!', data.message);
        }
        break;

      case 'location_updated':
        // Cliente recebe atualização de localização do prestador
        if (user?.user_type === 2 && data.request_id === currentRequest?.id) {
          setAssignedProvider(prev => prev ? {
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude
          } : null);
        }
        break;

      case 'request_status_updated':
        // Ambos recebem atualizações de status
        if (data.request_id === currentRequest?.id) {
          setCurrentRequest(prev => prev ? { ...prev, status: data.status } : null);
        }
        break;
    }
  }, [user, currentRequest, loadProviderData]);

  // Carregar dados iniciais e recarregar periodicamente
  useEffect(() => {
    if (user && isConnected) {
      loadActiveRequest();

      // Recarregar a cada 30 segundos para sincronizar com mudanças (reduzido de 10s)
      const interval = setInterval(() => {
        loadActiveRequest();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id, isConnected]); // Removido loadActiveRequest das dependências

  // Configurar listeners de eventos em tempo real
  useEffect(() => {
    if (!isConnected) return;

    // Aqui você pode adicionar listeners específicos para eventos do WebSocket
    // Por enquanto, os eventos são tratados no RealtimeContext

    return () => {
      // Cleanup se necessário
    };
  }, [isConnected, handleRealtimeMessage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  const value: MatchingContextType = {
    currentRequest,
    assignedProvider,
    searchingProviders,
    requestService,
    cancelRequest,
    completeService,
    acceptRequest,
    rejectRequest,
    updateLocation,
    markArrived,
    startService,
    finishService,
    isConnected,
  };

  return <MatchingContext.Provider value={value}>{children}</MatchingContext.Provider>;
};
