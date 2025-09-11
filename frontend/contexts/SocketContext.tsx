import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
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

  useEffect(() => {
    if (user && token) {
      console.log('🔌 Conectando ao Socket.io...');
      
      try {
        const newSocket = io(process.env.EXPO_PUBLIC_BACKEND_URL!, {
          auth: {
            user_id: user.id,
            user_type: user.user_type,
            token: token,
          },
          transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
          console.log('✅ Socket.io conectado:', newSocket.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Socket.io desconectado');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Erro de conexão Socket.io:', error);
          setIsConnected(false);
        });

        newSocket.on('new_request', (data) => {
          console.log('🔔 Nova solicitação recebida:', data);
        });

        newSocket.on('request_accepted', (data) => {
          console.log('✅ Solicitação aceita:', data);
        });

        newSocket.on('request_completed', (data) => {
          console.log('🎉 Serviço concluído:', data);
        });

        newSocket.on('location_updated', (data) => {
          console.log('📍 Localização atualizada:', data);
        });

        setSocket(newSocket);

        return () => {
          console.log('🔌 Desconectando Socket.io...');
          newSocket.close();
          setSocket(null);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('❌ Erro ao criar Socket.io:', error);
      }
    }
  }, [user, token]);

  const value: SocketContextType = {
    socket,
    isConnected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};