import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface RealtimeContextType {
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
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
  const { user, token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomsRef = useRef<Set<string>>(new Set());

  const connectWebSocket = () => {
    if (!user || !token) return;

    const wsUrl = process.env.EXPO_PUBLIC_SOCKET_URL || process.env.EXPO_PUBLIC_API_URL;
    if (!wsUrl) {
      console.warn('⚠️ [REALTIME] URL do WebSocket não configurada');
      return;
    }

    // Converter URL HTTP para WebSocket
    const wsUrlConverted = wsUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const fullWsUrl = `${wsUrlConverted}/ws?token=${token}&user_id=${user.id}&user_type=${user.user_type}`;

    console.log('🔌 [REALTIME] Conectando WebSocket:', fullWsUrl);

    try {
      const ws = new WebSocket(fullWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [REALTIME] WebSocket conectado');
        setIsConnected(true);
        
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
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Reconectar se não foi fechado intencionalmente
        if (event.code !== 1000 && user && token) {
          console.log('🔄 [REALTIME] Tentando reconectar em 3s...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ [REALTIME] Erro no WebSocket:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao criar WebSocket:', error);
    }
  };

  const handleMessage = (data: any) => {
    console.log('📨 [REALTIME] Mensagem recebida:', data);

    switch (data.type) {
      case 'pong':
        // Heartbeat response
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
        
      default:
        console.log('📨 [REALTIME] Evento desconhecido:', data.type);
    }
  };

  const sendMessage = (event: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: event,
        data: data,
        timestamp: Date.now()
      };
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 [REALTIME] Enviando:', event, data);
    } else {
      console.warn('⚠️ [REALTIME] WebSocket não conectado para enviar:', event);
    }
  };

  const joinRoom = (roomId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', room: roomId }));
      roomsRef.current.add(roomId);
      console.log('🚪 [REALTIME] Entrando na sala:', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room', room: roomId }));
      roomsRef.current.delete(roomId);
      console.log('🚪 [REALTIME] Saindo da sala:', roomId);
    }
  };

  // Conectar quando usuário estiver autenticado
  useEffect(() => {
    if (user && token) {
      console.log('🔌 [REALTIME] Iniciando conexão WebSocket...');
      connectWebSocket();
    } else {
      console.log('⏳ [REALTIME] Aguardando autenticação...');
      if (wsRef.current) {
        wsRef.current.close(1000, 'User logged out');
        wsRef.current = null;
        setIsConnected(false);
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
        setIsConnected(false);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [user, token]);

  return (
    <RealtimeContext.Provider value={{ isConnected, sendMessage, joinRoom, leaveRoom }}>
      {children}
    </RealtimeContext.Provider>
  );
};
