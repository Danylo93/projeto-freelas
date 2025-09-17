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
  const socketRef = useRef<Socket | null>(null);

  console.log('🔍 [SOCKET] Estado atual:', { user: user?.name, token: !!token, isConnected });

  // Função para conectar o socket
  const connectSocket = () => {
    if (!SOCKET_URL || !user || !token) return;
    
    console.log('🔌 [SOCKET] Conectando em:', SOCKET_URL);
    
    // Desconectar socket existente se houver
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }
    
    // Criar nova conexão com configuração otimizada
    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      auth: {
        user_id: user.id,
        user_type: user.user_type,
        token: token,
      },
      extraHeaders: {
        'ngrok-skip-browser-warning': '1',
        'Access-Control-Allow-Origin': '*'
      },
      path: '/socket.io',
      forceNew: true,
      timeout: 30000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
    });
    
    // Configurar listeners com tratamento de erros aprimorado
    newSocket.on('connect', () => {
      console.log('✅ [SOCKET] Conectado com ID:', newSocket.id, 'via', newSocket.io.engine.transport.name);
      setIsConnected(true);
      
      // Monitorar upgrades de transporte
      newSocket.io.engine.on('upgrade', (transport) => {
        console.log('⬆️ [SOCKET] Transporte atualizado para:', transport);
      });
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('❌ [SOCKET] Desconectado. Motivo:', reason);
      setIsConnected(false);
      
      // Iniciar reconexão para certos tipos de desconexão
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
        console.log('🔄 [SOCKET] Iniciando reconexão após desconexão:', reason);
        if (!reconnectTimerRef.current) {
          attemptReconnect(0);
        }
      }
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Erro de conexão:', error.message, error);
      setIsConnected(false);
      
      // Tentar reconexão com configuração alternativa em caso de erro persistente
      if (error.message.includes('xhr poll error')) {
        console.log('🔧 [SOCKET] Tentando configuração alternativa para xhr poll error');
        if (!reconnectTimerRef.current) {
          attemptReconnect(0);
        }
      }
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [SOCKET] Reconectado após', attemptNumber, 'tentativas');
      setIsConnected(true);
    });
    
    // Event listeners específicos para o app
    newSocket.on('new_request', (data) => {
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
    
    newSocket.on('request_accepted', (data) => {
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
    
    // Salvar referências
    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  // Referência para o timer de reconexão
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Função para tentar reconexão com backoff exponencial
  const attemptReconnect = useRef((attempt = 0) => {
    const maxAttempts = 20;
    const baseDelay = 2000;
    const maxDelay = 30000;
    
    if (attempt >= maxAttempts) {
      console.warn('⚠️ [SOCKET] Número máximo de tentativas de reconexão atingido');
      return;
    }
    
    // Cálculo de backoff exponencial com jitter
    const delay = Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
    const jitter = delay * 0.2 * Math.random();
    const finalDelay = delay + jitter;
    
    console.log(`🔄 [SOCKET] Tentativa de reconexão ${attempt + 1}/${maxAttempts} em ${Math.round(finalDelay)}ms`);
    
    reconnectTimerRef.current = setTimeout(() => {
      if (!socketRef.current || !socketRef.current.connected) {
        console.log('🔌 [SOCKET] Tentando reconectar...');
        connectSocket();
        attemptReconnect.apply(attempt + 1);
      }
    }, finalDelay);
  }).current;

  // Iniciar conexão quando o usuário estiver autenticado
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

      // Limpar qualquer timer de reconexão existente
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Iniciar conexão
      connectSocket();
      
      // Iniciar mecanismo de verificação de conexão
      const connectionCheckInterval = setInterval(() => {
        if (socketRef.current && !socketRef.current.connected && !reconnectTimerRef.current) {
          console.log('🔄 [SOCKET] Conexão perdida, iniciando reconexão automática');
          attemptReconnect(0);
        }
      }, 5000);
      
      return () => {
        clearInterval(connectionCheckInterval);
      };
    } else {
      console.log('⏳ [SOCKET] Aguardando autenticação...');
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        console.log('🔌 [SOCKET] Desconectando socket na limpeza...');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      
      // Limpar timers de reconexão
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [user, token]);

  // Função para enviar mensagens
  const sendMessage = (event: string, data: any) => {
    if (socket && isConnected) {
      console.log('📤 [SOCKET] Enviando evento:', event, data);
      socket.emit(event, data);
    } else {
      console.warn('⚠️ [SOCKET] Tentativa de enviar mensagem sem conexão:', event);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};