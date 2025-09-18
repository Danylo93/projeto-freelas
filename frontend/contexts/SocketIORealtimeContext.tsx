import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/utils/config';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
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
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 segundo

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const handleMessage = useCallback((data: any) => {
    console.log('📨 [REALTIME] Mensagem recebida:', data.type || data);

    // Tratar diferentes tipos de eventos
    if (data.type) {
      switch (data.type) {
        case 'new_request':
          if (user?.user_type === 1) { // Provider
            Alert.alert(
              '🔔 Nova Solicitação!',
              `Cliente: ${data.client_name || 'Cliente'}\nServiço: ${data.category || 'N/A'}\nValor: R$ ${data.price || 'N/A'}`,
              [{ text: 'OK' }]
            );
          }
          break;
          
        case 'request_accepted':
          if (user?.user_type === 2) { // Client
            Alert.alert(
              '✅ Solicitação Aceita!',
              'O prestador aceitou seu serviço',
              [{ text: 'OK' }]
            );
          }
          break;
          
        case 'request_completed':
          if (user?.user_type === 2) { // Client
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
    }
  }, [user]);

  const connectSocket = useCallback(() => {
    if (!user || !token) {
      console.log('⏳ [REALTIME] Aguardando autenticação...');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('🔄 [REALTIME] Socket já conectado, ignorando...');
      return;
    }

    if (!SOCKET_URL) {
      console.warn('⚠️ [REALTIME] URL do Socket não configurada');
      setConnectionState('error');
      return;
    }

    cleanup();
    setConnectionState('connecting');

    console.log('🔌 [REALTIME] Conectando Socket.IO em:', SOCKET_URL);

    try {
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          user_id: user.id,
          user_type: user.user_type,
          token: token,
        },
        extraHeaders: {
          'ngrok-skip-browser-warning': '1',
        },
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: baseReconnectDelay,
        reconnectionDelayMax: 30000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ [REALTIME] Socket.IO conectado:', socket.id);
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0; // Reset counter on successful connection
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ [REALTIME] Socket.IO desconectado:', reason);
        setIsConnected(false);
        setConnectionState('disconnected');

        // Tentar reconectar apenas se não foi um fechamento intencional
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 [REALTIME] Tentando reconectar em ${delay}ms... (tentativa ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ [REALTIME] Máximo de tentativas de reconexão atingido');
          setConnectionState('error');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ [REALTIME] Erro de conexão Socket.IO:', error.message);
        setConnectionState('error');
      });

      // Listeners para eventos específicos
      socket.on('presence', (data) => {
        console.log('👤 [REALTIME] Presença:', data);
      });

      socket.on('status_updated', (data) => {
        console.log('🔄 [REALTIME] Status atualizado:', data);
        handleMessage({ type: 'status_updated', ...data });
      });

      socket.on('location_updated', (data) => {
        console.log('📍 [REALTIME] Localização atualizada:', data);
        handleMessage({ type: 'location_updated', ...data });
      });

      socket.on('lifecycle', (data) => {
        console.log('🔄 [REALTIME] Lifecycle:', data);
        handleMessage({ type: 'lifecycle', ...data });
      });

      socket.on('chat_message', (data) => {
        console.log('💬 [REALTIME] Chat:', data);
        handleMessage({ type: 'chat_message', ...data });
      });

      socket.on('room_joined', (data) => {
        console.log('🚪 [REALTIME] Entrou na sala:', data);
      });

      socket.on('room_left', (data) => {
        console.log('🚪 [REALTIME] Saiu da sala:', data);
      });

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao criar Socket.IO:', error);
      setConnectionState('error');
    }
  }, [user, token, cleanup, handleMessage]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      console.log('📤 [REALTIME] Mensagem enviada:', event, data);
    } else {
      console.warn('⚠️ [REALTIME] Socket não conectado, não é possível enviar mensagem');
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_request_room', { request_id: roomId });
      console.log('🚪 [REALTIME] Entrando na sala:', roomId);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_request_room', { request_id: roomId });
      console.log('🚪 [REALTIME] Saindo da sala:', roomId);
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 [REALTIME] Reconexão manual solicitada');
    reconnectAttemptsRef.current = 0;
    connectSocket();
  }, [connectSocket]);

  // Conectar quando user e token estiverem disponíveis
  useEffect(() => {
    if (user && token) {
      connectSocket();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user, token, connectSocket, cleanup]);

  const value = {
    isConnected,
    connectionState,
    sendMessage,
    joinRoom,
    leaveRoom,
    reconnect,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
