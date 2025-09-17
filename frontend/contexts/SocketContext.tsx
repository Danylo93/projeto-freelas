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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para conectar o socket
  const connectSocket = () => {
    if (!SOCKET_URL || !user || !token) {
      console.log('⏳ [SOCKET] Aguardando configuração...', { SOCKET_URL: !!SOCKET_URL, user: !!user, token: !!token });
      return;
    }
    
    console.log('🔌 [SOCKET] Conectando em:', SOCKET_URL);
    
    // Desconectar socket existente
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }
    
    // Criar nova conexão com configuração simplificada
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        user_id: user.id,
        user_type: user.user_type,
        token: token,
      },
      extraHeaders: {
        'ngrok-skip-browser-warning': '1',
      },
      path: '/socket.io',
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
    });
    
    // Event listeners
    newSocket.on('connect', () => {
      console.log('✅ [SOCKET] Conectado:', newSocket.id);
      setIsConnected(true);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('❌ [SOCKET] Desconectado:', reason);
      setIsConnected(false);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Erro de conexão:', error.message);
      setIsConnected(false);
    });
    
    // Eventos específicos do app
    newSocket.on('new_request', (data) => {
      console.log('🔔 [SOCKET] Nova solicitação:', data);
      if (user.user_type === 1) {
        Alert.alert(
          '🔔 Nova Solicitação!',
          `Cliente: ${data?.client_name || 'Cliente'}\nServiço: ${data?.category || 'N/A'}\nValor: R$ ${data?.price || 'N/A'}`,
          [{ text: 'OK' }]
        );
      }
    });
    
    newSocket.on('request_accepted', (data) => {
      console.log('✅ [SOCKET] Solicitação aceita:', data);
      if (user.user_type === 2) {
        Alert.alert(
          '✅ Solicitação Aceita!',
          'O prestador aceitou seu serviço',
          [{ text: 'OK' }]
        );
      }
    });
    
    newSocket.on('request_completed', (data) => {
      console.log('🎉 [SOCKET] Serviço concluído:', data);
      if (user.user_type === 2) {
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
    
    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  // Conectar quando usuário estiver autenticado
  useEffect(() => {
    if (user && token) {
      console.log('🔌 [SOCKET] Iniciando conexão...');
      connectSocket();
    } else {
      console.log('⏳ [SOCKET] Aguardando autenticação...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, token]);

  // Função para enviar mensagens
  const sendMessage = (event: string, data: any) => {
    if (socket && isConnected) {
      console.log('📤 [SOCKET] Enviando:', event, data);
      socket.emit(event, data);
    } else {
      console.warn('⚠️ [SOCKET] Socket não conectado para enviar:', event);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};