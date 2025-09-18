import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/utils/config';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionType: 'socketio' | 'websocket' | null;
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
  const [connectionType, setConnectionType] = useState<'socketio' | 'websocket' | null>(null);
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const cleanup = useCallback(() => {
    console.log('🧹 [REALTIME] Limpando conexões...');

    if (socketRef.current) {
      console.log('🧹 [REALTIME] Fechando Socket.IO...');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (wsRef.current) {
      console.log('🧹 [REALTIME] Fechando WebSocket...');
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setConnectionState('disconnected');
    setConnectionType(null);
  }, []);

  const handleMessage = useCallback((data: any) => {
    console.log('📨 [REALTIME] Mensagem recebida:', data.type || data);

    if (data.type) {
      switch (data.type) {
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
          
        default:
          console.log('📨 [REALTIME] Mensagem não tratada:', data);
      }
    }
  }, [user]);

  const tryWebSocketConnection = useCallback(() => {
    if (!user || !token || !SOCKET_URL) return;

    console.log('🔌 [REALTIME] Tentando WebSocket...');
    
    const wsUrl = `${SOCKET_URL.replace('http', 'ws')}/ws?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(user.id)}&user_type=${user.user_type}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [REALTIME] WebSocket conectado');
        setIsConnected(true);
        setConnectionState('connected');
        setConnectionType('websocket');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('❌ [REALTIME] Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('❌ [REALTIME] WebSocket desconectado:', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        setConnectionType(null);
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 [REALTIME] Tentando reconectar WebSocket em ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            tryWebSocketConnection();
          }, delay);
        } else {
          console.log('🔄 [REALTIME] Tentando Socket.IO como fallback...');
          trySocketIOConnection();
        }
      };

      ws.onerror = (error) => {
        console.error('❌ [REALTIME] Erro no WebSocket:', error);
        setConnectionState('error');
        // Tentar Socket.IO como fallback
        setTimeout(() => trySocketIOConnection(), 1000);
      };

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao criar WebSocket:', error);
      trySocketIOConnection();
    }
  }, [user, token, handleMessage]);

  const trySocketIOConnection = useCallback(() => {
    if (!user || !token || !SOCKET_URL) return;

    // Evitar múltiplas conexões
    if (socketRef.current && socketRef.current.connected) {
      console.log('🔄 [REALTIME] Socket.IO já conectado, ignorando...');
      return;
    }

    console.log('🔌 [REALTIME] Tentando Socket.IO...');

    try {
      const socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'], // Polling primeiro para compatibilidade
        auth: {
          user_id: user.id,
          user_type: user.user_type,
          token: token,
        },
        extraHeaders: {
          'ngrok-skip-browser-warning': '1',
        },
        timeout: 20000, // Timeout maior
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: baseReconnectDelay,
        reconnectionDelayMax: 30000,
        forceNew: true, // Força nova conexão
        upgrade: true, // Permite upgrade para WebSocket
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ [REALTIME] Socket.IO conectado:', socket.id);
        setIsConnected(true);
        setConnectionState('connected');
        setConnectionType('socketio');
        reconnectAttemptsRef.current = 0;
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ [REALTIME] Socket.IO desconectado:', reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        setConnectionType(null);
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
        handleMessage({ type: 'status_updated', ...data });
      });

      socket.on('location_updated', (data) => {
        handleMessage({ type: 'location_updated', ...data });
      });

      socket.on('lifecycle', (data) => {
        handleMessage({ type: 'lifecycle', ...data });
      });

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao criar Socket.IO:', error);
      setConnectionState('error');
    }
  }, [user, token, handleMessage]);

  const connectRealtime = useCallback(() => {
    if (!user || !token) {
      console.log('⏳ [REALTIME] Aguardando autenticação...');
      return;
    }

    if (isConnected || connectionState === 'connecting') {
      console.log('🔄 [REALTIME] Já conectado ou conectando, ignorando...');
      return;
    }

    cleanup();
    setConnectionState('connecting');

    // Usar apenas Socket.IO por enquanto, pois WebSocket não está funcionando no ngrok
    console.log('🔌 [REALTIME] Conectando diretamente via Socket.IO...');
    trySocketIOConnection();
  }, [user, token, isConnected, connectionState, cleanup, trySocketIOConnection]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (connectionType === 'socketio' && socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      console.log('📤 [REALTIME] Mensagem enviada via Socket.IO:', event, data);
    } else if (connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: event, ...data }));
      console.log('📤 [REALTIME] Mensagem enviada via WebSocket:', event, data);
    } else {
      console.warn('⚠️ [REALTIME] Não conectado, não é possível enviar mensagem');
    }
  }, [connectionType]);

  const joinRoom = useCallback((roomId: string) => {
    if (connectionType === 'socketio' && socketRef.current?.connected) {
      socketRef.current.emit('join_request_room', { request_id: roomId });
    } else if (connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', room: roomId }));
    }
    console.log('🚪 [REALTIME] Entrando na sala:', roomId);
  }, [connectionType]);

  const leaveRoom = useCallback((roomId: string) => {
    if (connectionType === 'socketio' && socketRef.current?.connected) {
      socketRef.current.emit('leave_request_room', { request_id: roomId });
    } else if (connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room', room: roomId }));
    }
    console.log('🚪 [REALTIME] Saindo da sala:', roomId);
  }, [connectionType]);

  const reconnect = useCallback(() => {
    console.log('🔄 [REALTIME] Reconexão manual solicitada');
    reconnectAttemptsRef.current = 0;
    cleanup(); // Limpar conexões existentes primeiro
    setTimeout(() => {
      connectRealtime();
    }, 1000); // Pequeno delay para garantir cleanup
  }, [cleanup, connectRealtime]);

  // Conectar quando user e token estiverem disponíveis
  useEffect(() => {
    if (user && token && !isConnected && connectionState === 'disconnected') {
      console.log('🔄 [REALTIME] Iniciando conexão...');
      connectRealtime();
    } else if (!user || !token) {
      cleanup();
    }

    return cleanup;
  }, [user?.id, token, isConnected, connectionState]); // Dependências específicas para evitar loops

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
