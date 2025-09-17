import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

import { SOCKET_URL } from '@/utils/config';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🚀 [SOCKET] SocketProvider inicializado');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();
  const fallbackAttemptedRef = useRef(false);

  console.log('🔍 [SOCKET] Estado atual:', { user: user?.name, token: !!token, isConnected });

  useEffect(() => {
    fallbackAttemptedRef.current = false;

    if (user && token) {
      console.log('🔌 [SOCKET] Iniciando conexão Socket.io...');
      console.log('🔌 [SOCKET] URL:', SOCKET_URL);
      console.log('🔌 [SOCKET] User:', user.name, 'Type:', user.user_type);

      if (!SOCKET_URL) {
        console.warn(
          '⚠️ [SOCKET] Nenhuma URL para Socket.io configurada. Defina EXPO_PUBLIC_SOCKET_URL, EXPO_PUBLIC_BACKEND_URL ou EXPO_PUBLIC_API_GATEWAY_URL.'
        );
        return;
      }

      try {
        type Transport = 'polling' | 'websocket';

        const socketUrl = SOCKET_URL;
        console.log('🔌 [SOCKET] Conectando em:', socketUrl);

        let active = true;
        let activeSocket: Socket | null = null;

        const attachCoreListeners = (instance: Socket, transports: Transport[], fallback?: Transport[]) => {
          instance.on('connect', () => {
            if (!active) {
              return;
            }
            console.log('✅ [SOCKET] Conectado com ID:', instance.id, 'via', transports.join(', '));
            setIsConnected(true);
          });

          instance.on('disconnect', (reason) => {
            if (!active) {
              return;
            }
            console.log('❌ [SOCKET] Desconectado. Motivo:', reason);
            setIsConnected(false);
          });

          instance.on('connect_error', (error: Error & { message: string }) => {
            if (!active) {
              return;
            }
            console.error('❌ [SOCKET] Erro de conexão:', error.message);
            console.error('❌ [SOCKET] Detalhes do erro:', error);
            setIsConnected(false);

            const lowerMessage = error.message?.toLowerCase?.() ?? '';
            const usingWebsocket = transports.includes('websocket');
            const usingPolling = transports.includes('polling');

            if (fallback && !fallbackAttemptedRef.current) {
              const shouldFallbackFromWebsocket = usingWebsocket && lowerMessage.includes('websocket');
              const shouldFallbackFromPolling = usingPolling && lowerMessage.includes('xhr poll error');

              if (shouldFallbackFromWebsocket || shouldFallbackFromPolling) {
                fallbackAttemptedRef.current = true;
                console.warn(
                  '⚠️ [SOCKET] Fallback de transporte acionado. Tentando novamente usando:',
                  fallback.join(', ')
                );
                instance.removeAllListeners();
                instance.disconnect();
                connectWithTransports(fallback);
                return;
              }
            }

            if (usingPolling && lowerMessage.includes('xhr poll error')) {
              console.warn(
                '⚠️ [SOCKET] Falha no transporte polling. Verifique se o gateway Socket.io está acessível via HTTPS.'
              );
            }
          });

          instance.on('reconnect', (attemptNumber) => {
            if (!active) {
              return;
            }
            console.log('🔄 [SOCKET] Reconectado após', attemptNumber, 'tentativas');
            setIsConnected(true);
          });

          instance.on('reconnect_error', (error) => {
            console.error('❌ [SOCKET] Erro de reconexão:', error.message);
          });

          instance.on('reconnect_failed', () => {
            console.error('❌ [SOCKET] Falha na reconexão após todas as tentativas');
            setIsConnected(false);
          });

          // Event listeners específicos para o app
          instance.on('new_request', (data) => {
            console.log('🔔 [SOCKET] Nova solicitação recebida:', data);
            if (user.user_type === 1) {
              const clientLabel = data?.client_name ?? data?.client_id ?? 'Cliente';
              Alert.alert(
                '🔔 Nova Solicitação!',
                `Cliente: ${clientLabel}\nServiço: ${data?.category ?? 'n/d'}\nValor: R$ ${data?.price ?? 'n/d'}`,
                [{ text: 'OK' }]
              );
            }
          });

          instance.on('request_accepted', (data) => {
            console.log('✅ [SOCKET] Solicitação aceita:', data);
            if (user.user_type === 2) {
              const category = data?.category ?? 'serviço';
              Alert.alert(
                '✅ Solicitação Aceita!',
                `O prestador aceitou seu serviço de ${category}`,
                [{ text: 'OK' }]
              );
            }
          });

          instance.on('request_completed', (data) => {
            console.log('🎉 [SOCKET] Serviço concluído:', data);
            if (user.user_type === 2) {
              Alert.alert(
                '🎉 Serviço Concluído!',
                'O prestador finalizou o serviço. Avalie a qualidade!',
                [{ text: 'OK' }]
              );
            }
          });

          instance.on('location_updated', (data) => {
            console.log('📍 [SOCKET] Localização atualizada:', data);
          });
        };

        const connectWithTransports = (transports: Transport[], fallback?: Transport[]) => {
          if (!active) {
            return;
          }
          console.log('🔌 [SOCKET] Tentando conectar com transportes:', transports.join(', '));
          const createdSocket = io(socketUrl, {
            auth: {
              user_id: user.id,
              user_type: user.user_type,
              token: token,
            },
            transports,
            path: '/socket.io',
            forceNew: true,
            timeout: 20000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            secure: socketUrl.startsWith('https://'),
            rejectUnauthorized: false, // Para ngrok
            autoConnect: true,
          });

          activeSocket = createdSocket;
          setSocket(createdSocket);
          attachCoreListeners(createdSocket, transports, fallback);
        };

        connectWithTransports(['websocket'], ['polling']);

        return () => {
          active = false;
          console.log('🔌 [SOCKET] Limpando conexão...');
          activeSocket?.removeAllListeners?.();
          activeSocket?.disconnect();
          activeSocket = null;
          setSocket(null);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('❌ [SOCKET] Erro ao criar Socket.io:', error);
        setIsConnected(false);
      }
    } else {
      console.log('⏳ [SOCKET] Aguardando autenticação...');
    }
  }, [token, user]);

  const sendMessage = (event: string, data: any) => {
    if (socket && isConnected) {
      console.log(`📤 [SOCKET] Enviando ${event}:`, data);
      socket.emit(event, data);
    } else {
      console.warn('⚠️ [SOCKET] Não conectado. Não foi possível enviar:', event);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};