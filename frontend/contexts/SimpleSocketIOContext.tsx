import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Alert, DeviceEventEmitter } from 'react-native';
import { io, Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { SOCKET_URL } from '@/utils/config';
import { router } from 'expo-router';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionType: 'socketio' | null;
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
  const isConnectingRef = useRef(false);

  const cleanup = useCallback(() => {
    console.log('🧹 [REALTIME] Limpando conexão Socket.IO...');
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    isConnectingRef.current = false;
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const handleMessage = useCallback((data: any) => {

    if (data.type) {
      switch (data.type) {
        case 'new_request':
          // Emitir evento customizado usando DeviceEventEmitter
          DeviceEventEmitter.emit('new-request', data);

          if (user?.user_type === 1) {
            // Enviar notificação push
            Notifications.scheduleNotificationAsync({
              content: {
                title: '🔔 Nova Solicitação!',
                body: `${data.category || 'Serviço'} - R$ ${data.price || 'N/A'}\nCliente: ${data.client_name || 'Cliente'}${data.distance ? `\nDistância: ${data.distance} km` : ''}`,
                data: {
                  type: 'new_request',
                  ...data,
                },
                sound: 'default',
                priority: Notifications.AndroidImportance.HIGH,
              },
              trigger: null, // Imediato
            });

            Alert.alert(
              '🔔 Nova Solicitação!',
              `Cliente: ${data.client_name || 'Cliente'}\nServiço: ${data.category || 'N/A'}\nValor: R$ ${data.price || 'N/A'}`,
              [
                {
                  text: 'Ver Detalhes',
                  onPress: () => {
                    router.push('/service-flow');
                  }
                },
                { text: 'Ignorar', style: 'cancel' }
              ]
            );
          }
          break;

        case 'lifecycle':
          // Tratar eventos de lifecycle do Kafka
          const eventType = data.type || data.event_type;

          if (eventType === 'request.created' && user?.user_type === 1) {
            // Enviar notificação push
            Notifications.scheduleNotificationAsync({
              content: {
                title: '🔔 Nova Solicitação Disponível!',
                body: `Uma nova solicitação foi criada\nID: ${data.request_id}`,
                data: {
                  type: 'new_request_created',
                  ...data,
                },
                sound: 'default',
              },
              trigger: null,
            });

            // Nova solicitação criada - notificar prestadores
            Alert.alert(
              '🔔 Nova Solicitação Disponível!',
              `Uma nova solicitação foi criada.\nID: ${data.request_id}\nCliente: ${data.client_id}`,
              [
                { text: 'Ignorar', style: 'cancel' },
                {
                  text: 'Ver Detalhes',
                  onPress: () => {
                    router.push('/service-flow');
                  }
                }
              ]
            );
          } else if (eventType === 'request.accepted' && user?.user_type === 2) {
            // Solicitação aceita - notificar cliente
            Alert.alert(
              '✅ Solicitação Aceita!',
              `Prestador ID: ${data.provider_id} aceitou sua solicitação`,
              [{ text: 'OK' }]
            );
          }
          break;

        case 'request_accepted':
          // Emitir evento customizado usando DeviceEventEmitter
          DeviceEventEmitter.emit('request-accepted', data);

          if (user?.user_type === 2) {
            Alert.alert(
              '✅ Solicitação Aceita!',
              'O prestador aceitou seu serviço',
              [{ text: 'Ver no Mapa', onPress: () => console.log('Navegar para service-flow') }]
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

        case 'status_updated':
          DeviceEventEmitter.emit('status-updated', data);
          break;

        case 'location_updated':
          DeviceEventEmitter.emit('location-updated', data);
          break;
      }
    }
  }, [user]);

  const connectSocket = useCallback(() => {
    if (!user || !token || !SOCKET_URL) {
      console.log('⏳ [REALTIME] Aguardando autenticação...');
      return;
    }

    if (isConnectingRef.current || (socketRef.current && socketRef.current.connected)) {
      console.log('🔄 [REALTIME] Já conectando ou conectado, ignorando...');
      return;
    }

    isConnectingRef.current = true;
    setConnectionState('connecting');

    console.log('🔌 [REALTIME] Conectando Socket.IO...');
    console.log('🔌 [REALTIME] URL:', SOCKET_URL);
    console.log('🔌 [REALTIME] User:', { id: user.id, type: user.user_type });

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
        timeout: 20000,
        reconnection: true, // Habilitar reconexão automática
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        forceNew: true,
        upgrade: true, // Permite upgrade para WebSocket
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ [REALTIME] Socket.IO conectado com sucesso!', socket.id);
        setIsConnected(true);
        setConnectionState('connected');
        isConnectingRef.current = false;

        // Entrar em room específica baseada no tipo de usuário
        if (user?.user_type === 1) {
          console.log('🏠 [REALTIME] Prestador entrando na sala:', `provider_${user.id}`);
          // Prestador entra na sala específica para receber notificações
          socket.emit('join_room', {
            user_id: user.id,
            user_type: 1
          });
        } else if (user?.user_type === 2) {
          console.log('🏠 [REALTIME] Cliente entrando na sala:', `client_${user.id}`);
          socket.emit('join_room', {
            user_id: user.id,
            user_type: 2
          });
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ [REALTIME] Socket.IO desconectado:', reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        isConnectingRef.current = false;
      });

      socket.on('connect_error', (error) => {
        console.error('❌ [REALTIME] Erro de conexão Socket.IO:', error.message);
        console.error('❌ [REALTIME] Detalhes do erro:', error);
        setConnectionState('error');
        isConnectingRef.current = false;
      });

      // Listeners para eventos específicos
      socket.on('presence', (data) => {
        // Presença de usuários - pode ser usado para mostrar status online/offline
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

      socket.on('new_request', (data) => {
        console.log('🔔 [REALTIME] *** NOVA SOLICITAÇÃO RECEBIDA ***');
        console.log('🔔 [REALTIME] Dados:', JSON.stringify(data, null, 2));
        handleMessage({ type: 'new_request', ...data });
      });

      socket.on('offer_received', (data) => {
        console.log('✅ [REALTIME] *** OFERTA RECEBIDA ***');
        console.log('✅ [REALTIME] Dados:', JSON.stringify(data, null, 2));
        handleMessage({ type: 'offer_received', ...data });
      });

      socket.on('room_joined', (data) => {
        console.log('🏠 [REALTIME] Entrou na sala:', data);
      });

      socket.on('joined_room', (data) => {
        console.log('🏠 [REALTIME] Confirmação de entrada na sala:', data);
      });

      socket.on('chat_message', (data) => {
        handleMessage({ type: 'chat_message', ...data });
      });

      socket.on('room_joined', (data) => {
        // Confirmação de entrada na sala
      });

      socket.on('room_left', (data) => {
        // Confirmação de saída da sala
      });



    } catch (error) {
      console.error('❌ [REALTIME] Erro ao criar Socket.IO:', error);
      setConnectionState('error');
      isConnectingRef.current = false;
    }
  }, [user, token, handleMessage]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_request_room', { request_id: roomId });
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_request_room', { request_id: roomId });
    }
  }, []);

  const reconnect = useCallback(() => {
    cleanup();
    setTimeout(() => {
      connectSocket();
    }, 1000);
  }, [cleanup, connectSocket]);

  // Conectar quando user e token estiverem disponíveis
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (user && token && !isConnected && connectionState === 'disconnected') {
      timeoutId = setTimeout(() => {
        connectSocket();
      }, 1000); // Delay para evitar múltiplas conexões
    } else if (!user || !token) {
      cleanup();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, token, isConnected, connectionState, connectSocket, cleanup]);

  // Cleanup ao desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const value = {
    isConnected,
    connectionState,
    connectionType: 'socketio' as const,
    sendMessage,
    joinRoom,
    leaveRoom,
    reconnect,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
