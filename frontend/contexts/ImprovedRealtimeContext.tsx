import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomsRef = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 segundo

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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
  }, []);

  const handleMessage = useCallback((data: any) => {
    console.log('📨 [REALTIME] Mensagem recebida:', data.type);

    switch (data.type) {
      case 'pong':
        // Heartbeat response - connection is alive
        break;
        
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
  }, [user]);

  const connectWebSocket = useCallback(() => {
    if (!user || !token) {
      console.log('⏳ [REALTIME] Aguardando autenticação...');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 [REALTIME] Conexão já existe, ignorando...');
      return;
    }

    const wsUrl = process.env.EXPO_PUBLIC_SOCKET_URL || process.env.EXPO_PUBLIC_API_URL;
    if (!wsUrl) {
      console.warn('⚠️ [REALTIME] URL do WebSocket não configurada');
      setConnectionState('error');
      return;
    }

    cleanup();
    setConnectionState('connecting');

    // Converter URL HTTP para WebSocket e adicionar parâmetros de autenticação
    const wsUrlConverted = wsUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const fullWsUrl = `${wsUrlConverted}/ws?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(user.id)}&user_type=${user.user_type}`;
    
    console.log('🔌 [REALTIME] Conectando WebSocket...');

    try {
      const ws = new WebSocket(fullWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [REALTIME] WebSocket conectado');
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0; // Reset counter on successful connection
        
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
        setIsConnected(false);
        setConnectionState('disconnected');
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
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
          console.error('❌ [REALTIME] Máximo de tentativas de reconexão atingido');
          setConnectionState('error');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ [REALTIME] Erro no WebSocket:', error);
        setConnectionState('error');
      };

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao criar WebSocket:', error);
      setConnectionState('error');
    }
  }, [user, token, cleanup, handleMessage]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: event, ...data }));
    } else {
      console.warn('⚠️ [REALTIME] WebSocket não conectado, não é possível enviar mensagem');
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    roomsRef.current.add(roomId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', room: roomId }));
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    roomsRef.current.delete(roomId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room', room: roomId }));
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 [REALTIME] Reconexão manual solicitada');
    reconnectAttemptsRef.current = 0;
    connectWebSocket();
  }, [connectWebSocket]);

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
    sendMessage,
    joinRoom,
    leaveRoom,
    reconnect,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
