import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/config';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionType: 'websocket' | 'polling' | 'offline';
  sendMessage: (event: string, data: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'offline'>('offline');
  const { user, token } = useAuth();
  
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomsRef = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
    setConnectionType('offline');
  }, []);

  const handleMessage = useCallback((data: any) => {
    console.log('📨 [REALTIME] Mensagem recebida:', data.type);

    switch (data.type) {
      case 'pong':
        break;
        
      case 'new_request':
        if (user?.user_type === 1) {
          Alert.alert(
            '🔔 Nova Solicitação!',
            `Cliente: ${data.client_name || 'Cliente'}\nServiço: ${data.category || 'N/A'}\nValor: R$ ${data.price || 'N/A'}`,
            [{ text: 'OK' }]
          );
        }
        break;
        
      case 'request_accepted':
        if (user?.user_type === 2) {
          Alert.alert(
            '✅ Solicitação Aceita!',
            'O prestador aceitou seu serviço',
            [{ text: 'OK' }]
          );
        }
        break;
        
      case 'request_completed':
        if (user?.user_type === 2) {
          Alert.alert(
            '🎉 Serviço Concluído!',
            'O prestador finalizou o serviço. Avalie a qualidade!',
            [{ text: 'OK' }]
          );
        }
        break;
        
      case 'location_updated':
        console.log('📍 [REALTIME] Localização atualizada:', data);
        break;
        
      case 'error':
        console.error('❌ [REALTIME] Erro do servidor:', data.message);
        break;
        
      default:
        console.log('📨 [REALTIME] Mensagem não tratada:', data);
    }
  }, [user]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    
    console.log('🔄 [REALTIME] Iniciando polling como fallback...');
    setConnectionType('polling');
    setConnectionState('connecting');
    
    // Atualizar status imediatamente
    setIsConnected(true);
    setConnectionState('connected');
    console.log('✅ [REALTIME] Status atualizado para conectado via polling');
    
    pollingRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/notifications/poll`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
          timeout: 5000
        });
        
        // Atualizar status de conexão primeiro
        console.log('🔄 [REALTIME] Polling response recebida, isConnected:', isConnected);
        setIsConnected(true);
        setConnectionState('connected');
        console.log('✅ [REALTIME] Polling conectado - status atualizado');
        
        if (response.data) {
          // Simular notificação para teste
          const mockNotification = {
            type: 'test',
            message: 'Polling funcionando',
            timestamp: Date.now()
          };
          handleMessage(mockNotification);
        }
        
      } catch (error) {
        console.error('❌ [REALTIME] Erro no polling:', error);
        setIsConnected(false);
        setConnectionState('error');
        console.log('❌ [REALTIME] Status atualizado para erro');
      }
    }, 5000); // Poll a cada 5 segundos
  }, [token, handleMessage]);

  const connectWebSocket = useCallback(() => {
    if (!user || !token) {
      console.log('⏳ [REALTIME] Aguardando autenticação...');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 [REALTIME] Conexão já existe, ignorando...');
      return;
    }

    const wsUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    if (!wsUrl) {
      console.warn('⚠️ [REALTIME] URL do WebSocket não configurada');
      setConnectionState('error');
      startPolling(); // Fallback para polling
      return;
    }

    // Para desenvolvimento local, usar polling diretamente
    if (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
      console.log('🔄 [REALTIME] Ambiente local detectado, usando polling diretamente');
      startPolling();
      return;
    }

    cleanup();
    setConnectionState('connecting');
    setConnectionType('websocket');

    const wsUrlConverted = wsUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const fullWsUrl = `${wsUrlConverted}/ws?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(user.id)}&user_type=${user.user_type}`;
    
    console.log('🔌 [REALTIME] Conectando WebSocket...');
    console.log('🔌 [REALTIME] URL base:', wsUrl);
    console.log('🔌 [REALTIME] URL convertida:', wsUrlConverted);
    console.log('🔌 [REALTIME] URL completa:', fullWsUrl);

    try {
      const ws = new WebSocket(fullWsUrl);
      wsRef.current = ws;
      
      // Timeout para WebSocket - se não conectar em 3 segundos, usar polling
      const wsTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('⏰ [REALTIME] WebSocket timeout, iniciando polling...');
          ws.close();
          startPolling();
        }
      }, 3000);

      ws.onopen = () => {
        console.log('✅ [REALTIME] WebSocket conectado');
        clearTimeout(wsTimeout);
        setIsConnected(true);
        setConnectionState('connected');
        setConnectionType('websocket');
        reconnectAttemptsRef.current = 0;
        
        // Entrar nas salas salvas
        roomsRef.current.forEach(roomId => {
          ws.send(JSON.stringify({ type: 'join_room', room: roomId }));
        });

        // Iniciar heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('❌ [REALTIME] Erro ao processar mensagem:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('❌ [REALTIME] WebSocket desconectado:', event.code, event.reason);
        clearTimeout(wsTimeout);
        setIsConnected(false);
        setConnectionState('disconnected');
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Se foi erro 403 ou similar, usar polling
        if (event.code === 1006 || event.code === 403 || event.code === 1002) {
          console.log('🔄 [REALTIME] WebSocket bloqueado (código:', event.code, '), iniciando polling...');
          startPolling();
          return;
        }

        // Tentar reconectar apenas se não foi um fechamento intencional
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 [REALTIME] Tentando reconectar em ${delay}ms... (tentativa ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ [REALTIME] Máximo de tentativas de reconexão atingido, iniciando polling...');
          startPolling();
        }
      };

      ws.onerror = (error) => {
        console.error('❌ [REALTIME] Erro no WebSocket:', error);
        console.error('❌ [REALTIME] URL tentada:', fullWsUrl);
        console.error('❌ [REALTIME] User ID:', user?.id);
        console.error('❌ [REALTIME] User Type:', user?.user_type);
        console.error('❌ [REALTIME] Token presente:', !!token);
        clearTimeout(wsTimeout);
        setConnectionState('error');
        
        // Se WebSocket falhar, tentar polling imediatamente
        console.log('🔄 [REALTIME] WebSocket falhou, iniciando polling...');
        startPolling();
      };

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao criar WebSocket:', error);
      setConnectionState('error');
      startPolling(); // Fallback para polling
    }
  }, [user, token, cleanup, handleMessage, startPolling]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: event, ...data }));
    } else if (connectionType === 'polling') {
      // Para polling, enviar via HTTP
      axios.post(`${API_BASE_URL}/notifications/send`, {
        type: event,
        ...data
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': '1',
        }
      }).catch(error => {
        console.error('❌ [REALTIME] Erro ao enviar mensagem via polling:', error);
      });
    } else {
      console.warn('⚠️ [REALTIME] Nenhuma conexão disponível para enviar mensagem');
    }
  }, [connectionType, token]);

  const joinRoom = useCallback((roomId: string) => {
    roomsRef.current.add(roomId);
    if (connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', room: roomId }));
    }
  }, [connectionType]);

  const leaveRoom = useCallback((roomId: string) => {
    roomsRef.current.delete(roomId);
    if (connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room', room: roomId }));
    }
  }, [connectionType]);

  const reconnect = useCallback(() => {
    console.log('🔄 [REALTIME] Reconexão manual solicitada');
    reconnectAttemptsRef.current = 0;
    cleanup();
    connectWebSocket();
  }, [connectWebSocket, cleanup]);

  // Conectar quando user e token estiverem disponíveis
  useEffect(() => {
    if (user && token) {
      connectWebSocket();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user, token, connectWebSocket, cleanup]);

  const value = {
    isConnected,
    connectionState,
    connectionType,
    sendMessage,
    joinRoom,
    leaveRoom,
    reconnect,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
