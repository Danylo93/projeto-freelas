import React, { createContext, useContext, useEffect, useState } from 'react';
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
  
  console.log('🔍 [SOCKET] Estado atual:', { user: user?.name, token: !!token, isConnected });

  useEffect(() => {
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
        // Socket.io conecta no mesmo servidor da API mas não precisa do /api prefix
        const socketUrl = SOCKET_URL;
        console.log('🔌 [SOCKET] Conectando em:', socketUrl);

        const newSocket = io(socketUrl, {
          auth: {
            user_id: user.id,
            user_type: user.user_type,
            token: token,
          },
          transports: ['polling'], // Apenas polling por enquanto para debug - alterar para ['websocket']
          path: '/socket.io',
          forceNew: true,
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
          console.log('✅ [SOCKET] Conectado com ID:', newSocket.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ [SOCKET] Desconectado. Motivo:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ [SOCKET] Erro de conexão:', error.message);
          console.error('❌ [SOCKET] Detalhes do erro:', error);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 [SOCKET] Reconectado após', attemptNumber, 'tentativas');
          setIsConnected(true);
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('❌ [SOCKET] Erro de reconexão:', error.message);
        });

        newSocket.on('reconnect_failed', () => {
          console.error('❌ [SOCKET] Falha na reconexão após todas as tentativas');
          setIsConnected(false);
        });

        // Event listeners específicos para o app
        newSocket.on('new_request', (data) => {
          console.log('🔔 [SOCKET] Nova solicitação recebida:', data);
          if (user.user_type === 1) { // Prestador
            const clientLabel = data?.client_name ?? data?.client_id ?? 'Cliente';
            Alert.alert(
              '🔔 Nova Solicitação!',
              `Cliente: ${clientLabel}\nServiço: ${data?.category ?? 'n/d'}\nValor: R$ ${data?.price ?? 'n/d'}`,
              [{ text: 'OK' }]
            );
          }
        });

        newSocket.on('request_accepted', (data) => {
          console.log('✅ [SOCKET] Solicitação aceita:', data);
          if (user.user_type === 2) { // Cliente
            const category = data?.category ?? 'serviço';
            Alert.alert(
              '✅ Solicitação Aceita!',
              `O prestador aceitou seu serviço de ${category}`,
              [{ text: 'OK' }]
            );
          }
        });

        newSocket.on('request_completed', (data) => {
          console.log('🎉 [SOCKET] Serviço concluído:', data);
          if (user.user_type === 2) { // Cliente
            Alert.alert(
              '🎉 Serviço Concluído!',
              'O prestador finalizou o serviço. Avalie a qualidade!',
              [{ text: 'OK' }]
            );
          }
        });

        newSocket.on('location_updated', (data) => {
          console.log('📍 [SOCKET] Localização atualizada:', data);
        });

        setSocket(newSocket);

        return () => {
          console.log('🔌 [SOCKET] Limpando conexão...');
          newSocket.disconnect();
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
  }, [user, token]);

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